// Sensors
package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"path/filepath"
	//"strings"
	//"strconv"
	//"strings"

	"time"

	"../Backend/DbHelper"
	//_ "github.com/alexbrainman/odbc"
	//_ "github.com/mattn/go-sqlite3"
)

const TimeLayoutYYYYMMDD_HHMMSS = "2006-01-02 15:04:05"
const TimeLayoutYYYYMMDD_HHMMSSms = "2006-01-02 15:04:05.000"

type Report struct {
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Gender    *int64  `json:"gender"`
	SymptomId *int64  `json:"symptomId"`
	Comments  *string `json:"comments"`
}

type LatLng struct {
	Lat float64 `db:"Lat"`
	Lng float64 `db:"Lng"`
}

type SqlConnection struct {
	SqlDriver    string
	SqlConString string
	SqlConId     string
}

// Configuration struct is used to load/store the config parameters from/to a config file (Sensors.conf)
type Configuration struct {
	ListenOnPort   string
	SqlConnections SqlConnection
	Range          float64
	Precision      int64
	DeleteTimer    int64
}

var AppConf Configuration
var idChan chan *int64
var latChan chan float64
var lngChan chan float64

//ReadConf reads the configuration file (Algo.conf) and loads it to the AppConf structure
func ReadConf() error {
	_, fileName := getCurrentDir()
	fileName += "/LifeSaver.conf"
	file, fileErr := os.OpenFile(fileName, os.O_RDWR, 0)
	defer file.Close()
	if fileErr != nil {
		return fmt.Errorf("ReadConf err: Error while openning a configuration file: " + fileErr.Error())
	} else {
		decoder := json.NewDecoder(file)
		confErr := decoder.Decode(&AppConf)
		if confErr != nil {
			return fmt.Errorf("ReadConf err: " + confErr.Error()) //TODO : log
		}
	}
	return nil
}

func main() {
	fmt.Println("Starting process Sensors at ", time.Now().String())

	if err := ReadConf(); err != nil {
		fmt.Println(err.Error())
	}
	DbHelper.InitConnection(AppConf.SqlConnections.SqlConId, AppConf.SqlConnections.SqlDriver, AppConf.SqlConnections.SqlConString)
	idChan = make(chan *int64)
	latChan = make(chan float64)
	lngChan = make(chan float64)

	deleteTicker := time.NewTicker(time.Duration(AppConf.DeleteTimer) * time.Second)

	go func() { // TODO :Check all
		for Event := range deleteTicker.C {
			fmt.Println(Event)
			checkOldReports()
		}
	}()

	http.HandleFunc("/reports", reportsHandler)
	http.HandleFunc("/symptoms", symptomsHandler)

	fmt.Println("Listening on port ", AppConf.ListenOnPort)
	httpErr := http.ListenAndServe(":"+AppConf.ListenOnPort, nil)
	if httpErr != nil {
		fmt.Println("The process exited with error: ", httpErr.Error())
	}

}

func checkOldReports() {

	qry := `SELECT RecNo, SymptomId, InsertionTime from Reports WHERE CancelationDate is null
			Order By RecNo`

	type record struct {
		RecNo         int64
		SymptomId     int64
		InsertionTime string
	}
	var records []record
	if err := DbHelper.SelectToStruct(&records, AppConf.SqlConnections.SqlConId, qry); err != nil {
		fmt.Println("Error selecting to struct, ", err)
		return
	} else {

		if len(records) == 0 {
			fmt.Println("No New Reports")
			return
		}
		for _, val := range records {
			exp, err := getExpiryTime(val.SymptomId) // TODO : build a wrapper for id and expiry
			if err != nil {
				fmt.Println("getExpiryTime, ", err.Error())
				return
			}
			createdAt, err := time.Parse(TimeLayoutYYYYMMDD_HHMMSS, val.InsertionTime[:22])
			if err != nil {
				fmt.Println("error parse insertion time, ", err.Error())
				return
			}
			timeNow, err := time.Parse(TimeLayoutYYYYMMDD_HHMMSS, time.Now().String()[:22])
			if err != nil {
				fmt.Println("error parse now time, ", err.Error())
				return
			}
			if timeNow.Sub(createdAt) >= time.Duration(exp)*time.Minute {
				if err := deleteOldReport(val.RecNo); err != nil {
					fmt.Println(err.Error())
					//return
				} else {
					fmt.Println("success delete report, id: ", val.RecNo, " at time: ", time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS))
				}
			}

		}
	}

}

func deleteOldReport(recNo int64) error {

	qry := `UPDATE Reports SET CancelationDate = ?
			WHERE RecNo = ?`

	if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qry, time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS), recNo); err != nil {
		return fmt.Errorf("deleteOldReport, ", err)
	}
	return nil
}

func getExpiryTime(symId int64) (int64, error) {

	qry := `SELECT Expiry from Symptoms WHERE CancelationDate is null
			And SymptomId = ?`

	if exp, err := DbHelper.GetDbValueInt(AppConf.SqlConnections.SqlConId, qry, symId); err != nil {
		return -1, err
	} else {
		return exp, nil
	}

}

func reportsHandler(response http.ResponseWriter, request *http.Request) {

	//	urlVars := strings.Split(request.URL.Path, "/")
	//	if len(urlVars) > 2 {
	//		if len(urlVars[2]) != 0 {
	//			writeErrorResponse(response, "sensorReadings ", "Wrong url request: "+request.URL.Path+" ,expected: http://IP/sensorReadings", nil)
	//			return
	//		}
	//	}
	writeHeaders(response)
	switch request.Method {

	case "OPTIONS":
		return

	case "POST":

		if postData, err := ioutil.ReadAll(request.Body); err != nil {
			writeErrorResponse(response, "reportsHandler ", "error reading request", err)
			return
		} else {

			var report Report
			if err = json.Unmarshal(postData, &report); err != nil {
				writeErrorResponse(response, "reportsHandler ", "error parsing request", err)
				return
			} else {
				PrintAsJson(report)
				go sendDetails(report.SymptomId, report.Lat, report.Lng)
				if err := insertReport(AppConf.SqlConnections.SqlConId, report); err != nil {
					writeErrorResponse(response, "reportsHandler ", "error insert user to db", err)
					return
				} else {
					response.Write([]byte("ok"))
				}
			}
		}

	case "GET":
		symId := <-idChan
		curLat := <-latChan
		cutLng := <-lngChan
		qry := `SELECT Lat,Lng from Reports WHERE CancelationDate is null
					 And SymptomId = ? Order By RecNo`

		var latLng []LatLng
		if err := DbHelper.SelectToStruct(&latLng, AppConf.SqlConnections.SqlConId, qry, symId); err != nil {
			writeErrorResponse(response, "reportsHandler ", "error get lat and lng from db", err)
			return
		} else {
			PrintAsJson(latLng)
			if cnt, err := getNearReportsCount(latLng, curLat, cutLng); err != nil { //TODO : Send notification if there is a new Possible pandemic
				writeErrorResponse(response, "reportsHandler ", "error get relevant amount of reports", err)
			} else {
				type rep struct {
					Count int64 `json:"count"`
				}
				var r rep
				r.Count = cnt

				PrintAsJson(r)
				if bt, err := json.Marshal(r); err != nil {
					writeErrorResponse(response, "reportsHandler ", "error marshaling count", err)
				} else {
					response.Write(bt)
				}
			}
		}
	}

}

func symptomsHandler(response http.ResponseWriter, request *http.Request) {

	writeHeaders(response)
	switch request.Method {
	case "OPTIONS":
		return

	case "GET":
		type symptom struct {
			SymptomId   int64  `json:"symptomId"`
			Description string `json:"description"`
			BodyPart    int64  `json:"bodyPart"`
		}
		var symptoms []symptom
		qry := `SELECT SymptomId, Description, BodyPart 
				FROM Symptoms 
				WHERE CancelationDate is null
				Order By BodyPart`
		if err := DbHelper.SelectToStruct(&symptoms, AppConf.SqlConnections.SqlConId, qry); err != nil {
			writeErrorResponse(response, "symptomsHandler ", "error get symptoms from db", err)
			return
		} else {

			if bt, err := json.Marshal(symptoms); err != nil {
				writeErrorResponse(response, "symptomsHandler ", "error marshaling symptoms", err)
			} else {
				response.Write(bt)
			}
		}

	}
}

func getNearReportsCount(latLng []LatLng, curLat, curLng float64) (int64, error) {

	if len(latLng) == 0 {
		return 0, fmt.Errorf("No lat lng to check")
	}
	fmt.Println(len(latLng))
	count := -1 //Dont count yourself
	latUp := toFixed(curLat, AppConf.Precision) + AppConf.Range
	latDown := toFixed(curLat, AppConf.Precision) - AppConf.Range

	lngUp := toFixed(curLng, AppConf.Precision) + AppConf.Range
	lngDown := toFixed(curLng, AppConf.Precision) - AppConf.Range
	for _, val := range latLng {
		lat := toFixed(val.Lat, AppConf.Precision)
		lng := toFixed(val.Lng, AppConf.Precision)
		fmt.Println(latUp, lat, latDown)
		fmt.Println(lngUp, lng, lngDown)
		if inRange(lat, latUp, latDown) && inRange(lng, lngUp, lngDown) {
			count++
		}
	}
	return int64(count), nil
}

func inRange(target, up, down float64) bool {
	if target >= down && target <= up {
		return true
	}
	return false
}

func sendDetails(id *int64, lat, lng float64) {
	idChan <- id
	latChan <- lat
	lngChan <- lng
}

func insertReport(conKey string, r Report) error {

	qry := `INSERT INTO Reports(Lat, Lng, Gender, SymptomId, Comments, InsertionTime) values (?,?,?,?,?,?)`
	if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qry, r.Lat, r.Lng, r.Gender,
		r.SymptomId, r.Comments, time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS)); err != nil {
		fmt.Println(err)
		return err
	}
	return nil

}

func writeHeaders(response http.ResponseWriter) {
	response.Header().Set("Content-Type", "text/json")
	response.Header().Add("Access-Control-Allow-Origin", "*")
	response.Header().Add("charset", "utf-8")
	response.Header().Set("Access-Control-Allow-Origin", "*")
	response.Header().Add("Access-Control-Allow-Credentials", "true")
}

func writeErrorResponse(response http.ResponseWriter, source string, errorText string, err error) {
	if err != nil {
		errorText += " , " + err.Error()
	}
	fmt.Println("Error in " + source + " : " + errorText)
	response.WriteHeader(http.StatusInternalServerError)
	response.Write([]byte(errorText))
}

func round(num float64) int64 {
	return int64(num + math.Copysign(0.5, num))
}

func toFixed(num float64, precision int64) float64 {
	output := math.Pow(10, float64(precision))
	return float64(round(num*output)) / output
}

func getCurrentDir() (error, string) {
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		return err, ""
	}
	return nil, dir
}

func PrintAsJson(in ...interface{}) {
	for _, pr := range in {
		if bt, err := json.Marshal(pr); err != nil {
			fmt.Println("Cant print var as json.", err.Error())
		} else {
			fmt.Println(string(bt))
		}
	}
}

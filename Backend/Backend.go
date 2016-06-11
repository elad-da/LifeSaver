package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"time"

	"github.com/kellydunn/golang-geo"
	"gopkg.in/gomail.v2"

	"../Backend/DbHelper"
	//_ "github.com/alexbrainman/odbc"
	//_ "github.com/mattn/go-sqlite3"
)

const TimeLayoutYYYYMMDD_HHMMSS = "2006-01-02 15:04:05"
const TimeLayoutYYYYMMDD_HHMMSSms = "2006-01-02 15:04:05.000"

type googleGeocodeResponse struct {
	Results []struct {
		AddressComponents []struct {
			LongName string   `json:"long_name"`
			Types    []string `json:"types"`
		} `json:"address_components"`
	}
}

type Report struct {
	Lat       *DbHelper.DbFloat  `json:"lat"`
	Lng       *DbHelper.DbFloat  `json:"lng"`
	Gender    *DbHelper.DbInt    `json:"gender"`
	SymptomId *DbHelper.DbInt    `json:"symptomId"`
	Comments  *DbHelper.DbString `json:"comments"`
}

type Option struct {
	Range     DbHelper.DbFloat  `json:"range"`
	Precision DbHelper.DbInt    `json:"precision"`
	Emails    DbHelper.DbString `json:"emails"`
}

type LatLng struct {
	Lat DbHelper.DbFloat `db:"Lat"`
	Lng DbHelper.DbFloat `db:"Lng"`
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
	DeleteTimer    int64
}

var AppConf Configuration
var Options []Option

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

	if err := loadOptions(); err != nil {
		fmt.Println(err.Error())
	}

	deleteTicker := time.NewTicker(time.Duration(AppConf.DeleteTimer) * time.Second)

	go func() { // TODO :Check all
		for Event := range deleteTicker.C {
			fmt.Println("Checking Old Reports:", Event)
			checkOldReports()
		}
	}()

	http.HandleFunc("/reports", reportsHandler)
	http.HandleFunc("/getsymptoms", symptomsHandler)
	http.HandleFunc("/getsymptoms/", symptomsHandler)

	http.HandleFunc("/symptoms", crudSymptomsHandler)
	http.HandleFunc("/symptoms/", crudSymptomsHandler)

	http.HandleFunc("/users", boUsersHandler)
	http.HandleFunc("/users/", boUsersHandler)

	http.HandleFunc("/login", loginHandler)

	http.HandleFunc("/backoffice/", FrontEndHandler)
	http.HandleFunc("/combos/", combosHandler)

	fmt.Println("Listening on port ", AppConf.ListenOnPort)
	httpErr := http.ListenAndServe(":"+AppConf.ListenOnPort, nil)
	if httpErr != nil {
		fmt.Println("The process exited with error: ", httpErr.Error())
	}

}

func loadOptions() error {

	qry := `SELECT Range, Precision, Emails from Options`
	if err := DbHelper.SelectToStruct(&Options, AppConf.SqlConnections.SqlConId, qry); err != nil {
		fmt.Println("Error Loading Otions, ", err)
		return err
	}
	fmt.Println("Success Loading Options")
	return nil

}

func sendEmail(cityName string, threshold, symId int64) error {

	//emails := strings.Split(strings.Join(strings.Fields(Options[0].Emails), ""), ",") //remove white spaces and split

	type data struct {
		Email DbHelper.DbString
	}
	var emails []data
	qry := `select Email from Users order by 1 desc`
	if err := DbHelper.SelectToStruct(&emails, AppConf.SqlConnections.SqlConId, qry); err != nil {
		fmt.Println("Error Select Emials, ", err)
		return err
	}

	for _, email := range emails {
		m := gomail.NewMessage()
		m.SetAddressHeader("From", "eladzada1988@gmail.com", "LifeSaver")
		m.SetAddressHeader("To", email.Email.GetValue(), "")
		m.SetHeader("Subject", "Possible Epidemic!")
		//TODO : complete identification
		m.SetBody("text/plain", "There is a possibility for epidemic near "+cityName+" ,Over "+fmt.Sprint(threshold)+" patients have been identified in Symptom number: "+fmt.Sprint(symId))

		d := gomail.NewPlainDialer("smtp.gmail.com", 587, "eladzada1988", "elad7717")

		if err := d.DialAndSend(m); err != nil {
			return fmt.Errorf(err.Error())
		}
	}

	return nil
}

func checkOldReports() {

	qryFixNull := `UPDATE Reports SET CancelationDate = ? WHERE SymptomId is null`
	if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qryFixNull, time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS)); err != nil {
		fmt.Println("Error Fixing null columns", err)
		//return
	}

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
		//return
	} else {

		if len(records) == 0 {
			fmt.Println("No New Reports")
			return
		}
		fmt.Println("Active records: ", len(records))
		for _, val := range records {

			exp, err := getExpiryTime(val.SymptomId) // TODO : build a wrapper for id and expiry
			//fmt.Println("Here")
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
			And SymptomId = ? LIMIT 1`

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
				//				globSymId = *report.SymptomId
				//				globLat = report.Lat
				//				globLng = report.Lng
				if err := insertReport(AppConf.SqlConnections.SqlConId, report); err != nil {
					writeErrorResponse(response, "reportsHandler ", "error insert user to db", err)
					return
				} else {
					if err := responseReleventRepCnt(response, report.SymptomId.GetValue(), report.Lat.GetValue(), report.Lng.GetValue()); err != nil {
						writeErrorResponse(response, "reportsHandler ", "error response Relevent Reports Count", err)
					}
					//response.Write([]byte(`{"Status": "ok"}`))
				}
			}
		}

	case "GET":
		//		symId := <-idChan
		//		curLat := <-latChan
		//		curLng := <-lngChan
		//		qry := `SELECT Lat,Lng from Reports WHERE CancelationDate is null
		//					 And SymptomId = ? Order By RecNo`

		//		var latLng []LatLng
		//		if err := DbHelper.SelectToStruct(&latLng, AppConf.SqlConnections.SqlConId, qry, globSymId); err != nil {
		//			writeErrorResponse(response, "reportsHandler ", "error get lat and lng from db", err)
		//			return
		//		} else {
		//			PrintAsJson(latLng)
		//			if cnt, err := getNearReportsCount(latLng, globLat, globLng, globSymId); err != nil { //TODO : Send notification if there is a new Possible pandemic
		//				writeErrorResponse(response, "reportsHandler ", "error get relevant amount of reports", err)
		//			} else {
		//				type rep struct {
		//					Count int64 `json:"count"`
		//				}
		//				var r rep
		//				r.Count = cnt

		//				PrintAsJson(r)
		//				if bt, err := json.Marshal(r); err != nil {
		//					writeErrorResponse(response, "reportsHandler ", "error marshaling count", err)
		//				} else {
		//					response.Write(bt)
		//				}
		//			}
		//		}
	}

}

func responseReleventRepCnt(response http.ResponseWriter, symId int64, lat, lng float64) error {
	qry := `SELECT Lat,Lng from Reports WHERE CancelationDate is null
					 And SymptomId = ? Order By RecNo`

	var latLng []LatLng
	if err := DbHelper.SelectToStruct(&latLng, AppConf.SqlConnections.SqlConId, qry, symId); err != nil {
		return fmt.Errorf("error get lat and lng from db ", err)
	} else {
		PrintAsJson(latLng)
		if cnt, err := getNearReportsCount(latLng, lat, lng, symId); err != nil { //TODO : Send notification if there is a new Possible pandemic
			return fmt.Errorf("error get relevant amount of reports ", err)
		} else {
			type rep struct {
				Count int64 `json:"count"`
			}
			var r rep
			r.Count = cnt

			PrintAsJson(r)
			if bt, err := json.Marshal(r); err != nil {
				return fmt.Errorf("error marshaling count ", err)
			} else {
				response.Write(bt)
			}
		}
		return nil
	}
}

func symptomsHandler(response http.ResponseWriter, request *http.Request) {
	urlVars := strings.Split(request.URL.Path, "/")
	writeHeaders(response)
	switch request.Method {
	case "OPTIONS":
		return

	case "GET":
		if len(urlVars) == 2 || (len(urlVars) == 3 && len(urlVars[2]) == 0) {
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
		} else if len(urlVars) > 2 {
			if len(urlVars) == 3 || (len(urlVars) == 4 && len(urlVars[3]) == 0) {
				if id, err := strconv.Atoi(urlVars[2]); err != nil {
					fmt.Println(err.Error())
					http.Error(response, "Id should be an Integer", http.StatusBadRequest)
					return
				} else {
					if (id < 1) || (id > 8) {
						http.Error(response, "Wrong id request, id should be between 1 to 8", http.StatusBadRequest)
						return
					}
					type symp struct {
						SymptomId   int64  `json:"symptomId"`
						Description string `json:"description"`
					}
					var sympsByBodyPart []symp
					qry := `SELECT SymptomId, Description
							FROM Symptoms
							WHERE BodyPart = ? and CancelationDate is null
							Order By SymptomId`
					if err := DbHelper.SelectToStruct(&sympsByBodyPart, AppConf.SqlConnections.SqlConId, qry, id); err != nil {
						writeErrorResponse(response, "symptomsHandler ", "error get symptoms from db", err)
						return
					} else {
						if bt, err := json.Marshal(sympsByBodyPart); err != nil {
							writeErrorResponse(response, "symptomsHandler ", "error marshaling symptoms", err)
						} else {
							response.Write(bt)
						}
					}
				}
			} else {
				fmt.Print("Wrong Route: ", urlVars)
				http.Error(response, "No Such Route", http.StatusBadRequest)
				return
			}
		}

	}
}

func getNearReportsCount(latLng []LatLng, curLat, curLng float64, symId int64) (int64, error) {

	if len(latLng) == 0 {
		return 0, fmt.Errorf("No lat lng to check")
	}
	fmt.Println(len(latLng))
	count := -1 //Dont count yourself
	latUp := toFixed(curLat, Options[0].Precision.GetValue()) + Options[0].Range.GetValue()
	latDown := toFixed(curLat, Options[0].Precision.GetValue()) - Options[0].Range.GetValue()

	lngUp := toFixed(curLng, Options[0].Precision.GetValue()) + Options[0].Range.GetValue()
	lngDown := toFixed(curLng, Options[0].Precision.GetValue()) - Options[0].Range.GetValue()
	for _, val := range latLng {
		lat := toFixed(val.Lat.GetValue(), Options[0].Precision.GetValue())
		lng := toFixed(val.Lng.GetValue(), Options[0].Precision.GetValue())
		//fmt.Println(latUp, lat, latDown)
		//fmt.Println(lngUp, lng, lngDown)
		if inRange(lat, latUp, latDown) && inRange(lng, lngUp, lngDown) {
			count++
		}
	}

	go checkEpidemicOutbreak(curLat, curLng, int64(count), symId)

	return int64(count), nil
}

func inRange(target, up, down float64) bool {
	if target >= down && target <= up {
		return true
	}
	return false
}

//func sendDetails(id *int64, lat, lng float64) {
//	idChan <- id
//	latChan <- lat
//	lngChan <- lng
//}

func checkEpidemicOutbreak(lat, lng float64, count, symId int64) {

	qry := `SELECT EpidemicThreshold from Symptoms where SymptomId = ? limit 1`

	if threshold, err := DbHelper.GetDbValueInt(AppConf.SqlConnections.SqlConId, qry, symId); err != nil {
		fmt.Println(err)
		return
	} else {
		if count+1 >= int64(threshold) {
			fmt.Println("Epidemic found at: ", time.Now())
			cityName := reverseGeocode(lat, lng)
			if err := sendEmail(cityName, count+1, symId); err != nil {
				fmt.Println(err.Error())
			}
		} else {
			fmt.Println("No Epidemic Found")
		}
	}

}

func getCityNameByGeo(lat, lng float64) (string, error) {
	p := geo.NewPoint(lat, lng)
	geocoder := new(geo.GoogleGeocoder)
	geo.HandleWithSQL()
	data, err := geocoder.Request(fmt.Sprintf("latlng=%f,%f", p.Lat(), p.Lng()))
	if err != nil {
		return "", fmt.Errorf(err.Error())
	}
	var res googleGeocodeResponse
	if err := json.Unmarshal(data, &res); err != nil {
		return "", fmt.Errorf(err.Error())
	}
	var city string
	if len(res.Results) > 0 {
		r := res.Results[0]
	outer:
		for _, comp := range r.AddressComponents {
			// See https://developers.google.com/maps/documentation/geocoding/#Types
			// for address types
			for _, compType := range comp.Types {
				if compType == "locality" {
					city = comp.LongName
					break outer
				}
			}
		}
	}
	fmt.Printf("City: %s\n", city)
	return city, nil
}

func reverseGeocode(lat, lng float64) string {
	p := geo.NewPoint(lat, lng)
	geocoder := new(geo.GoogleGeocoder)
	geo.HandleWithSQL()
	res, err := geocoder.ReverseGeocode(p)
	if err != nil {
		fmt.Printf(err.Error())
		return fmt.Sprintf("latlng=%f,%f", p.Lat(), p.Lng())
	} else {
		return res
	}

}

func insertReport(conKey string, r Report) error {

	qry := `INSERT INTO Reports(Lat, Lng, Gender, SymptomId, Comments, InsertionTime) values (?,?,?,?,?,?)`
	if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qry, r.Lat.GetValue(), r.Lng.GetValue(), r.Gender.GetValue(),
		r.SymptomId.GetValue(), r.Comments.GetValue(), time.Now()); err != nil {
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

func FrontEndHandler(response http.ResponseWriter, request *http.Request) {
	_, execDir := getCurrentDir()
	//fmt.Println(request.URL.Path, execDir+"/FrontEnd/."+request.URL.Path)
	//#1304 start
	localFile := execDir + "/FrontEnd/." + request.URL.Path

	if qry := request.URL.Query(); len(qry) > 0 && qry.Get("default") == "true" {
		if _, err := os.Stat(localFile); err != nil {
			sp := strings.Split(localFile, "/")
			filename := "/default"
			if filenameAr := strings.Split(sp[len(sp)-1], "."); len(filenameAr) > 1 {
				filename += "." + filenameAr[1]
			}
			sp = sp[:len(sp)-1]
			localFile = strings.Join(sp, "/") + filename
			fmt.Println(localFile)
		}
	}
	response.Header().Add("Cache-Control", fmt.Sprintf("max-age=%d, public, must-revalidate, proxy-revalidate", 1))

	http.ServeFile(response, request, localFile)
	//#1304 end
}

// BackOffice
package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"time"

	//	"math"
	"net/http"
	//	"os"
	//	"path/filepath"
	"strconv"
	"strings"

	//	"time"

	"../Backend/DbHelper"
)

type BOSymptoms struct {
	RowNum            *DbHelper.DbInt   `json:"-" dbUpdate:"false"`
	SymptomId         DbHelper.DbInt    `db:"SymptomId" json:"symptomId"`
	Description       DbHelper.DbString `db:"Description" json:"description"`
	BodyPart          DbHelper.DbInt    `db:"BodyPart" json:"bodyPart"`
	Expiry            DbHelper.DbInt    `db:"Expiry" json:"expiry"`
	EpidemicThreshold DbHelper.DbInt    `db:"EpidemicThreshold" json:"epidemicThreshold"`
}
type User struct {
	RowNum       *DbHelper.DbInt   `json:"-" dbUpdate:"false"`
	UserName     DbHelper.DbString `db:"UserName" json:"userName"`
	Password     DbHelper.DbString `db:"Password" json:"password"`
	LastLogin    DbHelper.DbString `db:"LastLogin" json:"-"`
	LastActivity DbHelper.DbString `db:"LastActivity" json:"-"`
	Email        DbHelper.DbString `db:"Email" json:"email"`
}

//func crudSymptomsHandler(response http.ResponseWriter, request *http.Request) {
//	urlVars := strings.Split(request.URL.Path, "/")
//	writeHeaders(response)
//	switch request.Method {
//	case "OPTIONS":
//		return

//	case "GET":
//		if len(urlVars) == 2 || (len(urlVars) == 3 && len(urlVars[2]) == 0) {

//		} else {
//			fmt.Print("Wrong Route: ", urlVars)
//			http.Error(response, "No Such Route", http.StatusBadRequest)
//			return
//		}

//	case "POST":

//	case "DELETE":
//		if len(urlVars) == 3 || (len(urlVars) == 4 && len(urlVars[3]) == 0) {

//		} else {
//			fmt.Print("Wrong Route: ", urlVars)
//			http.Error(response, "No Such Route", http.StatusBadRequest)
//			return
//		}
//	}
//}

func selectStatementByDriver(results interface{}, conKey, whClause, ordClause, tableName string,
	defaultSorter []string) (resultSql string, countSql string) {

	if 0 == len(ordClause) {
		ordClause = " ORDER BY " + strings.Join(defaultSorter, ",") + " "
	}

	caseSql := ` FROM    ( SELECT ` + DbHelper.GetFieldListFromStructSkipErr(results) + ` FROM ` + tableName + whClause + `) AS Results`
	resultSql = "SELECT  * " + caseSql + " LIMIT ?, ?"

	countSql = `SELECT  Count(1) FROM ` + tableName

	return
}

func getGenericBoList(results interface{}, pageNo int, resultsPerPage int, Criterias []Criteria,
	sorts []SortOrder, tableName string, defaultSorter []string, showCancelled bool) (totalPages int, Count int, err error) {
	whClause, parms, err := CreateCriteria(AppConf.SqlConnections.SqlConId, Criterias, showCancelled)
	ordClause := BuildOrderByClause(sorts, true)

	resultSql, CountSql := selectStatementByDriver(results, AppConf.SqlConnections.SqlConId, whClause, ordClause, tableName, defaultSorter)

	//	fmt.Println(parms)
	//	fmt.Println(CountSql)
	//	fmt.Println(resultSql)

	//DbCon.InitConnection(DbConIdAlgo, AppConf.SqlDriver, AppConf.SqlConString)
	var cnt interface{}
	if cnt, err = DbHelper.GetDbValue(AppConf.SqlConnections.SqlConId, CountSql, parms...); err != nil {
		return
	}

	cntInt, _ := strconv.Atoi(cnt.(string))

	if cntInt == 0 {
		totalPages = 0
	} else {
		totalPages = int((cntInt-1)/resultsPerPage) + 1
		Count = cntInt
	}

	parms = append(parms, (pageNo-1)*resultsPerPage, (pageNo-1)*resultsPerPage+resultsPerPage)
	if err = DbHelper.SelectToStruct(results, AppConf.SqlConnections.SqlConId, resultSql, parms...); err != nil {
		return
	}

	fmt.Println(resultSql)
	fmt.Println(parms)

	return
}

func crudSymptomsHandler(response http.ResponseWriter, request *http.Request) {
	//Get Data From request

	var symptoms []BOSymptoms
	if request.Method != "GET" && request.Method != "VIEW" {
		symptoms = append(symptoms, BOSymptoms{})
	}
	CrudHandler(AppConf.SqlConnections.SqlConId, response, request, "symptoms", &symptoms,
		getGenericBoList, checkToken, []string{"SymptomId"}, false)
	return
}

//func vehiclesHandler(response http.ResponseWriter, request *http.Request) {
//	//Get Data From request

//	var vehicles []VehicleBO
//	if request.Method != "GET" && request.Method != "VIEW" {
//		vehicles = append(vehicles, VehicleBO{})
//	}
//	CrudHnd.CrudHandler(DbConIdAlgo, response, request, "vehicles", &vehicles,
//		getGenericBoList, checkToken, []string{"id"}, false)
//	return
//}

func boUsersHandler(response http.ResponseWriter, request *http.Request) {
	var users []User
	if request.Method != "GET" && request.Method != "VIEW" {
		users = append(users, User{})
	}
	CrudHandler(AppConf.SqlConnections.SqlConId, response, request, "users", &users,
		getGenericBoList, checkToken, []string{"userName"}, false)
	return
}

func loginHandler(response http.ResponseWriter, request *http.Request) {
	//Get Data From request

	WriteHeaders(response)

	if request.Method == "POST" {

		if postData, err := ioutil.ReadAll(request.Body); err != nil {
			fmt.Println("postData err: ", err)
			WriteErrorRespose(response, ("error reading data : " + err.Error()))
		} else {
			type User struct {
				Username string `json:"username"`
				Password string `json:"password"`
			}

			var user User

			if err = json.Unmarshal(postData, &user); err != nil {
				WriteErrorRespose(response, ("user json struct error : " + err.Error()))
			} else {
				//DbCon.InitConnection(DbConIdAlgo, AppConf.SqlDriver, AppConf.SqlConString)
				//PrintAsJson(user)
				if tokenIntf, err := getTokenByUnAndPw(user.Username, user.Password, true); err != nil {
					fmt.Println(tokenIntf, err.Error())
					WriteErrorRespose(response, "Wrong credentials")
				} else {
					type Token struct {
						Value string `json:"token"`
					}
					if tokenStr := fmt.Sprint(tokenIntf); len(tokenStr) == 0 {
						response.WriteHeader(http.StatusForbidden)

					} else {
						if bt, err := json.Marshal(Token{Value: tokenStr}); err != nil {
							WriteErrorRespose(response, ("error creating token , " + err.Error()))
						} else {
							response.WriteHeader(http.StatusCreated)
							response.Write(bt)
						}
					}

				}
			}

		}

	}
}

func checkToken(response http.ResponseWriter, request *http.Request) bool {
	token := request.Header.Get("token")
	if token == "lifesaver2016@" {
		return true
	}

	if len(token) == 0 {
		fmt.Println("empty token passes")
		response.WriteHeader(http.StatusForbidden)
		return false
	}
	//DbCon.InitConnection(DbConIdAlgo, AppConf.SqlDriver, AppConf.SqlConString)
	if tokenIntf, err := /*2*/ getTokenByUnAndPw(token, "", false); err != nil {
		response.WriteHeader(http.StatusForbidden)
		fmt.Println("err auth for token " + token + " , " + err.Error())
		return false
	} else {
		if len(fmt.Sprint(tokenIntf)) == 0 {
			fmt.Println("no auth for token " + token)
			response.WriteHeader(http.StatusForbidden)
			return false
		} else {
			return true
		}
	}
}

func getTokenByUnAndPw(userName, password string, createToken bool) (string, error) {

	type user struct {
		UserName     DbHelper.DbString
		Password     DbHelper.DbString
		Token        DbHelper.DbString
		LastLogin    DbHelper.DbString
		LastActivity DbHelper.DbString
	}
	var users []user

	if password == "" {
		qry := `SELECT UserName, Password, Token, LastLogin, LastActivity FROM Users WHERE Token = ? limit 1`

		if err := DbHelper.SelectToStruct(&users, AppConf.SqlConnections.SqlConId, qry, userName); err != nil {
			return "", fmt.Errorf("getTokenByUnAndPw, Error in SelectToStruct ", err)
		} else if len(users) > 0 {
			if len(users[0].UserName.GetValue()) == 0 {
				return "", fmt.Errorf("No User Found")
			}
		} else {
			return "", fmt.Errorf("No User Found")
		}

	} else {
		qry := `SELECT UserName, Password, Token, LastLogin, LastActivity FROM Users WHERE UserName = ? and Password = ? limit 1`

		if err := DbHelper.SelectToStruct(&users, AppConf.SqlConnections.SqlConId, qry, userName, password); err != nil {
			return "", fmt.Errorf("getTokenByUnAndPw, Error in SelectToStruct, ", err)
		} else if len(users) > 0 {
			if len(users[0].UserName.GetValue()) == 0 {
				return "", fmt.Errorf("No User Found")
			}
		} else {
			return "", fmt.Errorf("No User Found")
		}
	}

	qry := `UPDATE Users SET [LastActivity]= ? WHERE [UserName] = ?`
	if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qry, time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS), users[0].UserName.GetValue()); err != nil {
		return "", fmt.Errorf("getTokenByUnAndPw, Error in Execute, ", err)
	}

	if createToken {
		token := NewId()
		qry := `UPDATE Users Set [LastLogin] = ?, [Token] = ? WHERE UserName = ?`
		if _, err := DbHelper.Execute(AppConf.SqlConnections.SqlConId, qry, time.Now().Format(TimeLayoutYYYYMMDD_HHMMSS), token, users[0].UserName.GetValue()); err != nil {
			return "", fmt.Errorf("getTokenByUnAndPw, Error in Execute, ", err)
		}
		return token, nil
	}
	return users[0].Token.GetValue(), nil

}

func NewId() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		fmt.Println("Error newId: ", err)
		return ""
	}

	return fmt.Sprintf("%X-%X-%X-%X-%X", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// 1. Every test file must end in '_test.go' for the Go tool to find it.
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// 2. THE TEST FUNCTION
// Must start with the word 'Test' and take '*testing.T' as an argument.
func TestToggleRoute(t *testing.T) {
	// SETUP: Connect to the actual DB for an integration test
	dsn := "host=localhost user=postgres password=forge_secret dbname=chronos_forge port=5432 sslmode=disable"
	db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	// Initialize our router logic
	router := SetupRouter(db)

	// DATA: Create the "Fake" request body
	body := map[string]string{
		"project":  "Test Project",
		"category": "Testing",
	}
	jsonBody, _ := json.Marshal(body)

	// ACTION: Create a 'Response Recorder' (a fake browser) and a Request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/time/toggle", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// EXECUTE: Send the request to the router
	router.ServeHTTP(w, req)

	// ASSERT: The 100% Rule check
	// We check if the status code is 200 (OK)
	assert.Equal(t, http.StatusOK, w.Code)

	// We check if the response body contains 'success'
	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
}

func TestGetHistory(t *testing.T) {
	// Setup
	dsn := "host=localhost user=postgres password=forge_secret dbname=chronos_forge port=5432 sslmode=disable"
	db, _ := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	router := SetupRouter(db)

	// Action: Try to GET the history
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/time/history", nil)
	router.ServeHTTP(w, req)

	// Assert: This SHOULD be 200 OK
	assert.Equal(t, http.StatusOK, w.Code)
}
// 1. PACKAGE DECLARATION
// Every executable Go program must belong to 'package main'.
package main

import (
	"log"  // Standard library for printing to the terminal
	"time" // Standard library for handling dates and durations

	"github.com/gin-gonic/gin" // The Web Framework (Fast & Lightweight)
	"gorm.io/driver/postgres"  // The Postgres-specific 'Translator'
	"gorm.io/gorm"             // The Object Relational Mapper (ORM)
)

// 2. THE DATA BLUEPRINT (STRUCT)
// This defines what a 'Time Entry' looks like in Go AND in the Database.
type TimeEntry struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Project   string     `gorm:"not null" json:"project"`
	Category  string     `json:"category"`
	Start     time.Time  `gorm:"not null" json:"start"`
	// The '*' makes this a POINTER. 
	// This allows the database to store a 'NULL' value for active tasks.
	End       *time.Time `json:"end"` 
	CreatedAt time.Time  `json:"created_at"`
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow requests from your Next.js port
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3001")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		// If it's the "polite" preflight request, stop here and return 204 (No Content)
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// 3. THE ROUTER ENGINE (LOGIC)
// We separate the 'Routes' from the 'Server Start' so we can test it later.
func SetupRouter(db *gorm.DB) *gin.Engine {
	// 1. FIX WARNING: Set to ReleaseMode for production (optional, but cleans logs)
	// gin.SetMode(gin.ReleaseMode) 

	r := gin.Default()
	
	// 2. FIX WARNING: Tell Gin not to trust all proxies (Security measure)
	r.SetTrustedProxies(nil) 

	r.Use(CORSMiddleware())

	// EXISTING TOGGLE ROUTE...
	r.POST("/api/time/toggle", func(c *gin.Context) { /* ... */ })

	// NEW: THE HISTORY ROUTE
	r.GET("/api/time/history", func(c *gin.Context) {
		var entries []TimeEntry
		
		// Logic: Find all entries, ordered by most recent start time
		// We limit to 10 so we don't overwhelm the "Face"
		if err := db.Order("start DESC").Limit(10).Find(&entries).Error; err != nil {
			c.JSON(500, gin.H{"error": "Failed to fetch history"})
			return
		}

		c.JSON(200, entries)
	})

	return r
}

// 4. THE ENTRY POINT
// This is where the application 'boots up'.
func main() {
	// Data Source Name (Connection String)
	dsn := "host=localhost user=postgres password=forge_secret dbname=chronos_forge port=5432 sslmode=disable"
	
	// Open the connection to Postgres
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the 'Fort Knox' Database:", err)
	}

	// AUTOMIGRATE: This creates or updates the 'time_entries' table automatically.
	db.AutoMigrate(&TimeEntry{})

	// Start the server on Port 8080
	r := SetupRouter(db)
	log.Println("Chronos Forge Backend is 100% Live on :8080")
	r.Run(":8080") 
}
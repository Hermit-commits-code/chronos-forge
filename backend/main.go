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
		// This is the "Master Key" for development
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3001")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		// We add 'Content-Type' explicitly here to ensure the browser is happy
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			// A 204 means "I'm okay with this, proceed with the actual POST"
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// 3. THE ROUTER ENGINE (LOGIC)
func SetupRouter(db *gorm.DB) *gin.Engine {
	// 1. PERMANENT WARNING FIX: Tell Gin we are in a local dev environment
	r := gin.Default()
	
	// This silences the "Trusted Proxies" warning permanently
	r.SetTrustedProxies(nil) 

	r.Use(CORSMiddleware())

	// TOGGLE ROUTE
	r.POST("/api/time/toggle", func(c *gin.Context) {
		var input struct {
			Project  string `json:"project"`
			Category string `json:"category"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}
		now := time.Now()
		err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&TimeEntry{}).Where("\"end\" IS NULL").Update("end", now).Error; err != nil {
				return err
			}
			return tx.Create(&TimeEntry{Project: input.Project, Category: input.Category, Start: now}).Error
		})
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "success"})
	})

	// HISTORY ROUTE (Make sure this is inside SetupRouter!)
	r.GET("/api/time/history", func(c *gin.Context) {
		var entries []TimeEntry
		if err := db.Order("start DESC").Limit(10).Find(&entries).Error; err != nil {
			c.JSON(500, gin.H{"error": "Database error"})
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
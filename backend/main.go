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
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
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
func SetupRouter(db *gorm.DB) *gin.Engine {
  r := gin.Default()
  r.SetTrustedProxies(nil)
  r.Use(CORSMiddleware())

  // ROUTE: POST /api/time/toggle
  r.POST("/api/time/toggle", func(c *gin.Context) {
    // 1. Corrected Struct Definition
    var input struct {
      Project  string `json:"project"`
      Category string `json:"category"`
    }

    // 2. Bind JSON
    if err := c.ShouldBindJSON(&input); err != nil {
      c.JSON(400, gin.H{"error": "Invalid input data"})
      return
    }

    now := time.Now()

    // 3. Transaction Logic
    err := db.Transaction(func(tx *gorm.DB) error {
      if err := tx.Model(&TimeEntry{}).Where("\"end\" IS NULL").Update("end", now).Error; err != nil {
        return err
      }
      newEntry := TimeEntry{
        Project:  input.Project,
        Category: input.Category,
        Start:    now,
      }
      return tx.Create(&newEntry).Error
    })

    if err != nil {
      c.JSON(500, gin.H{"error": "Database transaction failed"})
      return
    }

    c.JSON(200, gin.H{"status": "success", "active_project": input.Project})
  })

  // ROUTE: GET /api/time/history
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
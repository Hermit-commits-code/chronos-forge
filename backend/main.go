// 1. PACKAGE DECLARATION
// Every executable Go program must belong to 'package main'.
package main

import (
	"fmt"
	"log" // Standard library for printing to the terminal
	"os"
	"time" // Standard library for handling dates and durations

	"github.com/gin-gonic/gin" // The Web Framework (Fast & Lightweight)
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres" // The Postgres-specific 'Translator'
	"gorm.io/gorm"            // The Object Relational Mapper (ORM)
)

type User struct{
				ID 				uint		`gorm:"primaryKey" json:"id"`
				Email			string	`gorm:"unique;not null" json:"email"`
				Password	string	`gorm:"not null" json:"-"` // the "-" means NEVER send to JSON
				Entries		[]TimeEntry	`json:"entries"`		  // One user has many TimeEntries.
}

// 2. THE DATA BLUEPRINT (STRUCT)
// This defines what a 'Time Entry' looks like in Go AND in the Database.
type TimeEntry struct {
  ID        uint       `gorm:"primaryKey" json:"id"`
  UserID    uint       `json:"user_id"`
  Project   string     `gorm:"not null" json:"project"`
  Category  string     `json:"category"`
  Start     time.Time  `gorm:"not null" json:"start"`
  End       *time.Time `json:"end"` // MUST be a pointer to allow NULL in DB
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

func GenerateJWT(userID uint) (string, error) {
    // Fetch secret from env at runtime
    secret := []byte(os.Getenv("JWT_SECRET"))
    
    claims := jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(secret)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get the token from the "Authorization" header
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(401, gin.H{"error": "No passport (token) provided"})
			c.Abort()
			return
		}

		// 2. Parse and validate the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// 3. Success! Store the user_id in the context for the next function to use
			c.Set("userID", uint(claims["user_id"].(float64)))
			c.Next()
		} else {
			c.JSON(401, gin.H{"error": "Invalid or expired passport", "details": err.Error()})
			c.Abort()
		}
	}
}

// 3. THE ROUTER ENGINE (LOGIC)
func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.Use(CORSMiddleware())

	// --- PUBLIC ROUTES ---
	// Anyone can access these to join the Forge or get a Passport (JWT)
	r.POST("/api/auth/register", func(c *gin.Context) {
		var input struct {
			Email    string `json:"email" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Email and password required"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to hash password"})
			return
		}

		user := User{
			Email:    input.Email,
			Password: string(hashedPassword),
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(400, gin.H{"error": "User already exists or database error"})
			return
		}

		c.JSON(201, gin.H{"message": "User forged successfully"})
	})

	r.POST("/api/auth/login", func(c *gin.Context) {
		var input struct {
			Email    string `json:"email" binding:"required"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}

		var user User
		if err := db.Where("email = ?", input.Email).First(&user).Error; err != nil {
			c.JSON(401, gin.H{"error": "Invalid credentials"})
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
			c.JSON(401, gin.H{"error": "Invalid credentials"})
			return
		}

		token, err := GenerateJWT(user.ID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Could not generate passport"})
			return
		}

		c.JSON(200, gin.H{
			"message": "Logged in successfully",
			"token":   token,
		})
	})

	// --- PROTECTED ROUTES ---
	// These routes are wrapped in AuthMiddleware. 
	// If the user doesn't have a valid JWT, they are rejected with 401.
	protected := r.Group("/api")
	protected.Use(AuthMiddleware())
	{
		// ROUTE: POST /api/time/toggle
		protected.POST("/time/toggle", func(c *gin.Context) {
			// Extract the userID injected by AuthMiddleware
			val, _ := c.Get("userID")
			userID := val.(uint)

			var input struct {
				Project  string `json:"project"`
				Category string `json:"category"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(400, gin.H{"error": "Invalid input data"})
				return
			}

			now := time.Now()

			err := db.Transaction(func(tx *gorm.DB) error {
				// 1. Close existing active shift ONLY for THIS specific user
				if err := tx.Model(&TimeEntry{}).Where("user_id = ? AND \"end\" IS NULL", userID).Update("end", now).Error; err != nil {
					return err
				}

				// 2. If command is "STOP", exit here
				if input.Project == "STOP" {
					return nil
				}

				// 3. Create new entry WITH the authenticated UserID
				newEntry := TimeEntry{
					UserID:   userID,
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
		protected.GET("/time/history", func(c *gin.Context) {
			val, _ := c.Get("userID")
			userID := val.(uint)

			var entries []TimeEntry
			// Only fetch shifts belonging to the logged-in user
			if err := db.Where("user_id = ?", userID).Order("start DESC").Limit(10).Find(&entries).Error; err != nil {
				c.JSON(500, gin.H{"error": "Database error"})
				return
			}
			c.JSON(200, entries)
		})

		// ROUTE: GET /api/time/summary
		protected.GET("/time/summary", func(c *gin.Context) {
			val, _ := c.Get("userID")
			userID := val.(uint)

			var entries []TimeEntry
			// Get beginning of today (midnight)
			now := time.Now()
			today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

			// Fetch all entries from today for this user
			if err := db.Where("user_id = ? AND start >= ?", userID, today).Find(&entries).Error; err != nil {
					c.JSON(500, gin.H{"error": "Failed to fetch summary"})
					return
			}

			var totalSeconds float64
			for _, entry := range entries {
					if entry.End != nil {
							totalSeconds += entry.End.Sub(entry.Start).Seconds()
					} else {
							// If it's still active, count time from start until NOW
							totalSeconds += time.Since(entry.Start).Seconds()
					}
			}

			c.JSON(200, gin.H{
					"total_seconds": totalSeconds,
					"formatted":     fmt.Sprintf("%.1f hours", totalSeconds/3600),
			})
		})

		// ROUTE: POST /api/time/manual
		// ROUTE: POST /api/time/manual
		protected.POST("/time/manual", func(c *gin.Context) {
    val, _ := c.Get("userID")
    userID := val.(uint)

    // FIX: We define the input to match the flat JSON coming from the frontend
    var input struct {
        Project  string    `json:"project" binding:"required"`
        Category string    `json:"category" binding:"required"`
        Start    time.Time `json:"start" binding:"required"`
        End      time.Time `json:"end" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Missing or invalid fields. Ensure dates are correct."})
        return
    }

    if input.Start.After(input.End) {
        c.JSON(400, gin.H{"error": "The start of the forge cannot be after its end."})
        return
    }

    // FIX: We take the address of input.End to satisfy the *time.Time requirement
    newEntry := TimeEntry{
        UserID:   userID,
        Project:  input.Project,
        Category: input.Category,
        Start:    input.Start,
        End:      &input.End, 
    }

    if err := db.Create(&newEntry).Error; err != nil {
        c.JSON(500, gin.H{"error": "Database rejected the manual forge."})
        return
    }

    c.JSON(201, gin.H{"status": "success"})
		})
	}

	return r
}
// 4. THE ENTRY POINT
// This is where the application 'boots up'.
func main() {
	// Load the .env file
	if err:= godotenv.Load(); err != nil {
		log.Println("No .env file found, falling back to system env.")
	}
	// Data Source Name (Connection String)
	dsn := os.Getenv("DB_DSN")

	// Open the connection to Postgres
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to the 'Fort Knox' Database:", err)
	}

	// AUTOMIGRATE: This creates or updates the 'time_entries' table automatically.
	db.AutoMigrate(&User{}, &TimeEntry{})

	//  Port
	port := os.Getenv("PORT")
	if port == "" {port = "8080"}
	// Start the server on Port 8080
	r := SetupRouter(db)
	log.Println("Chronos Forge Backend is 100% Live on :8080")
	r.Run(":" + port)
}
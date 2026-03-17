package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID    uint   `gorm:"primaryKey"`
	Email string `gorm:"unique"`
}

type Recipe struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	UserID   uint   `gorm:"not null;index" json:"user_id"`
	Name     string `gorm:"not null" json:"name"`
	Project  string `gorm:"not null" json:"project"`
	Category string `json:"category"`
	Color    string `json:"color"`
}

func main() {
	// 1. SMART ENV LOADING
	// This finds the absolute path to the .env file relative to the script location
	ex, _ := os.Getwd()
	envPath := filepath.Join(ex, ".env")
	
	err := godotenv.Load(envPath)
	if err != nil {
		// Fallback: Try one level up if we are deep in cmd/seed
		envPath = filepath.Join(ex, "../../.env")
		_ = godotenv.Load(envPath)
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("❌ FATAL: DATABASE_URL not found. Tried: ", envPath)
	}

	// 2. CONNECT
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ FATAL: Database connection failed: %v", err)
	}

	// 3. SEED LOGIC
	var adminUser User
	if err := db.First(&adminUser).Error; err != nil {
		fmt.Println("⚠️  Warning: No user found. Register in the UI first.")
		return
	}

	defaultRecipes := []Recipe{
		{UserID: adminUser.ID, Name: "Deep Forge", Project: "Chronos Forge", Category: "Development", Color: "orange"},
		{UserID: adminUser.ID, Name: "Admin Ledger", Project: "Admin", Category: "Management", Color: "purple"},
		{UserID: adminUser.ID, Name: "Quick Patch", Project: "Chronos Forge", Category: "Bugs", Color: "red"},
	}

	fmt.Printf("⚒️  Priming Forge for: %s\n", adminUser.Email)
	
	for _, r := range defaultRecipes {
		db.Where(Recipe{Name: r.Name, UserID: r.UserID}).FirstOrCreate(&r)
		fmt.Printf("✅ %s: Ready\n", r.Name)
	}

	fmt.Println("\n🔥 Production Seed Complete.")
}
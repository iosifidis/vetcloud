package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/iosifidis/vetcloud/internal/catalog"
	"github.com/iosifidis/vetcloud/internal/config"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	if cfg.SingleTenant {
		log.Fatalf("Cannot run vetcloud-admin in SINGLE_TENANT mode")
	}

	// Connect to catalog database
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.CatalogDatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to catalog database: %v", err)
	}
	defer pool.Close()

	catalogQueries := catalog.New(pool)

	switch command {
	case "tenant":
		if len(os.Args) < 3 {
			printTenantUsage()
			os.Exit(1)
		}
		tenantCmd := os.Args[2]
		handleTenantCommand(ctx, catalogQueries, tenantCmd, os.Args[3:])
	default:
		fmt.Printf("Unknown command: %s\n", command)
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("vetcloud-admin is a CLI tool for managing the VetCloud backend.")
	fmt.Println("\nUsage:")
	fmt.Println("  vetcloud-admin <command> [arguments]")
	fmt.Println("\nCommands:")
	fmt.Println("  tenant      Manage tenants")
}

func printTenantUsage() {
	fmt.Println("Usage: vetcloud-admin tenant <subcommand> [arguments]")
	fmt.Println("\nSubcommands:")
	fmt.Println("  create      Create a new tenant")
	fmt.Println("  list        List all active tenants")
	fmt.Println("  deactivate  Deactivate a tenant")
}

func handleTenantCommand(ctx context.Context, queries *catalog.Queries, cmd string, args []string) {
	switch cmd {
	case "create":
		createCmd := flag.NewFlagSet("create", flag.ExitOnError)
		name := createCmd.String("name", "", "Name of the clinic")
		slug := createCmd.String("slug", "", "Subdomain slug (e.g. clinic-a)")
		dbUrl := createCmd.String("db-url", "", "PostgreSQL connection string for the tenant DB")
		email := createCmd.String("email", "", "Owner email")
		plan := createCmd.String("plan", "basic", "Subscription plan")

		createCmd.Parse(args)

		if *name == "" || *slug == "" || *dbUrl == "" || *email == "" {
			fmt.Println("Error: --name, --slug, --db-url, and --email are required")
			createCmd.PrintDefaults()
			os.Exit(1)
		}

		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		tenant, err := queries.CreateTenant(ctx, catalog.CreateTenantParams{
			Name:       *name,
			Slug:       *slug,
			DbUrl:      *dbUrl,
			Plan:       *plan,
			OwnerEmail: *email,
		})

		if err != nil {
			log.Fatalf("failed to create tenant: %v", err)
		}

		fmt.Printf("Tenant created successfully!\nID: %d\nName: %s\nSlug: %s\nPlan: %s\n", 
			tenant.ID, tenant.Name, tenant.Slug, tenant.Plan)

		fmt.Println("\nNext steps:")
		fmt.Println("1. Ensure the PostgreSQL database exists for this tenant.")
		fmt.Println("2. Run database migrations for the new tenant.")

	case "list":
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		tenants, err := queries.ListActiveTenants(ctx)
		if err != nil {
			log.Fatalf("failed to list tenants: %v", err)
		}

		fmt.Printf("Found %d active tenants:\n", len(tenants))
		fmt.Printf("%-5s | %-20s | %-15s | %-10s\n", "ID", "Name", "Slug", "Plan")
		fmt.Println("----------------------------------------------------------")
		for _, t := range tenants {
			fmt.Printf("%-5d | %-20s | %-15s | %-10s\n", t.ID, t.Name, t.Slug, t.Plan)
		}

	case "deactivate":
		deactivateCmd := flag.NewFlagSet("deactivate", flag.ExitOnError)
		slug := deactivateCmd.String("slug", "", "Subdomain slug (e.g. clinic-a)")
		
		deactivateCmd.Parse(args)

		if *slug == "" {
			fmt.Println("Error: --slug is required")
			deactivateCmd.PrintDefaults()
			os.Exit(1)
		}

		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		err := queries.DeactivateTenant(ctx, *slug)
		if err != nil {
			log.Fatalf("failed to deactivate tenant: %v", err)
		}

		fmt.Printf("Tenant '%s' deactivated successfully.\n", *slug)

	default:
		fmt.Printf("Unknown tenant subcommand: %s\n", cmd)
		printTenantUsage()
		os.Exit(1)
	}
}

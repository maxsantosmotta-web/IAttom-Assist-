CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business', 'agency');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('product_discovery', 'product_validation', 'campaign', 'content', 'creative', 'video_script', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."credit_type" AS ENUM('initial', 'credit', 'debit', 'adjustment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('bug', 'feature', 'general', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('new', 'reviewed', 'resolved');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"beta_access" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"name" text NOT NULL,
	"type" "project_type" NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"project_id" integer,
	"project_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "credits_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "credit_type" NOT NULL,
	"feature" text,
	"description" text NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"message" text,
	"status" "waitlist_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"user_email" text NOT NULL,
	"user_name" text,
	"message" text NOT NULL,
	"category" "feedback_category" DEFAULT 'general' NOT NULL,
	"rating" integer,
	"status" "feedback_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"module" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"code" text NOT NULL,
	"total_uses" integer DEFAULT 0 NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_uses" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_code" text NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"credits_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_uses_referred_user_id_unique" UNIQUE("referred_user_id")
);
--> statement-breakpoint
CREATE TABLE "meta_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text DEFAULT '' NOT NULL,
	"app_secret" text DEFAULT '' NOT NULL,
	"verify_token" text DEFAULT '' NOT NULL,
	"user_access_token" text DEFAULT '' NOT NULL,
	"webhook_url" text DEFAULT '',
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meta_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" text,
	"event_type" text,
	"object_id" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meta_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"instagram_account_id" text,
	"webhook_subscribed" boolean DEFAULT false,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "meta_pages_page_id_unique" UNIQUE("page_id")
);
--> statement-breakpoint
CREATE TABLE "meta_instagram_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ig_id" text NOT NULL,
	"name" text DEFAULT '',
	"username" text DEFAULT '',
	"biography" text DEFAULT '',
	"followers_count" text DEFAULT '0',
	"page_id" text,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "meta_instagram_accounts_ig_id_unique" UNIQUE("ig_id")
);
--> statement-breakpoint
CREATE TABLE "shopee_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"partner_id" text DEFAULT '' NOT NULL,
	"partner_key" text DEFAULT '' NOT NULL,
	"shop_id" text DEFAULT '',
	"access_token" text DEFAULT '',
	"refresh_token" text DEFAULT '',
	"token_expiry" timestamp,
	"redirect_url" text DEFAULT '',
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shopee_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"name" text DEFAULT '',
	"price" text DEFAULT '0',
	"stock" integer DEFAULT 0,
	"status" text DEFAULT 'NORMAL',
	"category" text DEFAULT '',
	"image_url" text DEFAULT '',
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "shopee_products_item_id_unique" UNIQUE("item_id")
);
--> statement-breakpoint
CREATE TABLE "shopee_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_sn" text NOT NULL,
	"status" text DEFAULT '',
	"total_price" text DEFAULT '0',
	"buyer_username" text DEFAULT '',
	"create_time" timestamp,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "shopee_orders_order_sn_unique" UNIQUE("order_sn")
);
--> statement-breakpoint
CREATE TABLE "shopee_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text,
	"shop_id" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ml_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text DEFAULT '' NOT NULL,
	"client_secret" text DEFAULT '' NOT NULL,
	"access_token" text DEFAULT '',
	"refresh_token" text DEFAULT '',
	"token_expiry" timestamp,
	"user_id" text DEFAULT '',
	"nickname" text DEFAULT '',
	"site_id" text DEFAULT 'MLB',
	"redirect_uri" text DEFAULT '',
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ml_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"ml_item_id" text NOT NULL,
	"title" text DEFAULT '',
	"price" text DEFAULT '0',
	"available_quantity" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"category_id" text DEFAULT '',
	"permalink" text DEFAULT '',
	"clerk_user_id" text,
	"synced_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "ml_products_ml_item_id_unique" UNIQUE("ml_item_id")
);
--> statement-breakpoint
CREATE TABLE "ml_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ml_order_id" text NOT NULL,
	"status" text DEFAULT '',
	"total_amount" text DEFAULT '0',
	"buyer_nickname" text DEFAULT '',
	"date_created" timestamp,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "ml_orders_ml_order_id_unique" UNIQUE("ml_order_id")
);
--> statement-breakpoint
CREATE TABLE "ml_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text,
	"resource" text,
	"user_id" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hotmart_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text DEFAULT '' NOT NULL,
	"client_secret" text DEFAULT '' NOT NULL,
	"basic_token" text DEFAULT '' NOT NULL,
	"webhook_token" text DEFAULT '' NOT NULL,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tiktok_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_key" text DEFAULT '' NOT NULL,
	"client_secret" text DEFAULT '' NOT NULL,
	"redirect_uri" text DEFAULT '',
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tiktok_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text,
	"user_id" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hotmart_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text DEFAULT '',
	"format" text DEFAULT '',
	"status" text DEFAULT 'ACTIVE',
	"price" text DEFAULT '0',
	"currency" text DEFAULT 'BRL',
	"synced_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "hotmart_products_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "hotmart_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text,
	"transaction_id" text,
	"product_id" text,
	"buyer_email" text,
	"buyer_name" text,
	"value" text,
	"currency" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kiwify_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" text DEFAULT '' NOT NULL,
	"client_id" text DEFAULT '' NOT NULL,
	"client_secret" text DEFAULT '' NOT NULL,
	"webhook_secret" text DEFAULT '' NOT NULL,
	"access_token" text DEFAULT '',
	"token_expiry" timestamp,
	"is_active" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kiwify_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"name" text DEFAULT '',
	"type" text DEFAULT '',
	"status" text DEFAULT 'active',
	"price" text DEFAULT '0',
	"currency" text DEFAULT 'BRL',
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "kiwify_products_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "kiwify_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text,
	"order_id" text,
	"product_id" text,
	"buyer_email" text,
	"buyer_name" text,
	"value" text,
	"currency" text,
	"payload" jsonb,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trash_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_id" integer NOT NULL,
	"platform" text NOT NULL,
	"item_type" text NOT NULL,
	"name" text DEFAULT '',
	"previous_status" text DEFAULT '',
	"snapshot" text DEFAULT '{}',
	"clerk_user_id" text DEFAULT '',
	"deleted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_meta_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_hotmart_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_hotmart_product_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_hotmart_product_claims_unique" UNIQUE("clerk_user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "user_kiwify_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_shopee_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ml_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tiktok_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"platform_user_id" text DEFAULT '' NOT NULL,
	"platform_username" text DEFAULT '',
	"access_token" text DEFAULT '' NOT NULL,
	"refresh_token" text DEFAULT '',
	"expires_at" timestamp,
	"scopes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_items_v2" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"platform" text,
	"content" text DEFAULT '' NOT NULL,
	"data" text,
	"images_data" text,
	"has_images" boolean DEFAULT false NOT NULL,
	"videos_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "help_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"image_urls" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_meta_connections_clerk_user_id_idx" ON "user_meta_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_hotmart_connections_clerk_user_id_idx" ON "user_hotmart_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_kiwify_connections_clerk_user_id_idx" ON "user_kiwify_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_shopee_connections_clerk_user_id_idx" ON "user_shopee_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_ml_connections_clerk_user_id_idx" ON "user_ml_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_tiktok_connections_clerk_user_id_idx" ON "user_tiktok_connections" USING btree ("clerk_user_id");
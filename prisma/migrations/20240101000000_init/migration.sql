-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "kids_friendly" BOOLEAN NOT NULL DEFAULT false,
    "stroller_friendly" BOOLEAN NOT NULL DEFAULT false,
    "prayer_room" BOOLEAN NOT NULL DEFAULT false,
    "parking_ease" TEXT NOT NULL DEFAULT 'MEDIUM',
    "hours_json" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "place_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "crowd_level" TEXT,
    "wait_band" TEXT,
    "user_hash" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signal_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "Place" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prediction" (
    "place_id" TEXT NOT NULL PRIMARY KEY,
    "now_crowd_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "now_wait_band" TEXT NOT NULL DEFAULT '10-20',
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "confidence_score" REAL NOT NULL DEFAULT 0.0,
    "last_signal_at" DATETIME,
    "forecast_json" TEXT NOT NULL DEFAULT '[]',
    "best_windows_json" TEXT NOT NULL DEFAULT '[]',
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prediction_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "Place" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Place_category_idx" ON "Place"("category");

-- CreateIndex
CREATE INDEX "Place_district_idx" ON "Place"("district");

-- CreateIndex
CREATE INDEX "Place_lat_lng_idx" ON "Place"("lat", "lng");

-- CreateIndex
CREATE INDEX "Place_is_active_idx" ON "Place"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_ar_district_category_key" ON "Place"("name_ar", "district", "category");

-- CreateIndex
CREATE INDEX "Signal_place_id_idx" ON "Signal"("place_id");

-- CreateIndex
CREATE INDEX "Signal_created_at_idx" ON "Signal"("created_at");

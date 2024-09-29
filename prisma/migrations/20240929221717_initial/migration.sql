-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_name" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "UserAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "blocked_at" DATETIME,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "UserAuth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buy_item" TEXT NOT NULL,
    "buy_qty" REAL NOT NULL,
    "buy_rate" REAL NOT NULL,
    "buy_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance_qty" REAL NOT NULL,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    "created_by" INTEGER NOT NULL,
    CONSTRAINT "BuyLog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SellLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sell_qty" REAL NOT NULL,
    "sell_rate" REAL NOT NULL,
    "sell_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "buy_log_id" INTEGER NOT NULL,
    "batch_sell_action_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    "created_by" INTEGER NOT NULL,
    CONSTRAINT "SellLog_buy_log_id_fkey" FOREIGN KEY ("buy_log_id") REFERENCES "BuyLog" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SellLog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SellLog_batch_sell_action_id_fkey" FOREIGN KEY ("batch_sell_action_id") REFERENCES "BatchSellAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchSellAction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batch_code" TEXT NOT NULL,
    "sell_qty" REAL NOT NULL,
    "sell_rate" REAL NOT NULL,
    "sell_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    "created_by" INTEGER NOT NULL,
    CONSTRAINT "BatchSellAction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_name_key" ON "User"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_public_id_key" ON "User"("public_id");

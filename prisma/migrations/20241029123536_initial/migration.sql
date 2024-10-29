-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "user_name" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuth" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "blocked_at" TIMESTAMP(3),
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyLog" (
    "id" SERIAL NOT NULL,
    "buy_item" TEXT NOT NULL,
    "buy_qty" DOUBLE PRECISION NOT NULL,
    "buy_rate" DOUBLE PRECISION NOT NULL,
    "buy_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "balance_qty" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "BuyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellLog" (
    "id" SERIAL NOT NULL,
    "sell_qty" DOUBLE PRECISION NOT NULL,
    "sell_rate" DOUBLE PRECISION NOT NULL,
    "sell_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "buy_log_id" INTEGER NOT NULL,
    "batch_sell_action_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "SellLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSellAction" (
    "id" SERIAL NOT NULL,
    "batch_code" TEXT NOT NULL,
    "sell_qty" DOUBLE PRECISION NOT NULL,
    "sell_rate" DOUBLE PRECISION NOT NULL,
    "sell_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "BatchSellAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_name_key" ON "User"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_public_id_key" ON "User"("public_id");

-- AddForeignKey
ALTER TABLE "UserAuth" ADD CONSTRAINT "UserAuth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyLog" ADD CONSTRAINT "BuyLog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellLog" ADD CONSTRAINT "SellLog_buy_log_id_fkey" FOREIGN KEY ("buy_log_id") REFERENCES "BuyLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellLog" ADD CONSTRAINT "SellLog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellLog" ADD CONSTRAINT "SellLog_batch_sell_action_id_fkey" FOREIGN KEY ("batch_sell_action_id") REFERENCES "BatchSellAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSellAction" ADD CONSTRAINT "BatchSellAction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

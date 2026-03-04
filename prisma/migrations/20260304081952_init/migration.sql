-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boatName" TEXT NOT NULL,
    "boatType" TEXT,
    "boatNumber" TEXT NOT NULL,
    "yardNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vessel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vesselId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "stayingOnMooring" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdByUserId" TEXT,
    CONSTRAINT "Booking_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDate" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "launchStartTime" TEXT,
    "retrievalStartTime" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "updatedByUserId" TEXT,
    CONSTRAINT "DailyMessage_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_yardNumber_key" ON "Vessel"("yardNumber");

-- CreateIndex
CREATE INDEX "Vessel_userId_idx" ON "Vessel"("userId");

-- CreateIndex
CREATE INDEX "Vessel_yardNumber_idx" ON "Vessel"("yardNumber");

-- CreateIndex
CREATE INDEX "Booking_type_serviceDate_status_requestedAt_idx" ON "Booking"("type", "serviceDate", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "Booking_vesselId_type_serviceDate_idx" ON "Booking"("vesselId", "type", "serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMessage_serviceDate_key" ON "DailyMessage"("serviceDate");

-- CreateIndex
CREATE INDEX "DailyMessage_serviceDate_idx" ON "DailyMessage"("serviceDate");

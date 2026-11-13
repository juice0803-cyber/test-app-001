-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('FAT_LOSS', 'MUSCLE_GAIN', 'MAINTAIN', 'RECOMPOSITION');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "RiskContext" AS ENUM ('GENERAL', 'PREGNANCY', 'CLINICAL', 'EATING_CONCERN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "age" INTEGER,
    "sex" "Sex" NOT NULL DEFAULT 'UNSPECIFIED',
    "heightCm" DOUBLE PRECISION,
    "startingWeightKg" DOUBLE PRECISION,
    "targetWeightKg" DOUBLE PRECISION,
    "targetBodyFat" DOUBLE PRECISION,
    "targetMuscleKg" DOUBLE PRECISION,
    "goal" "Goal" NOT NULL DEFAULT 'MAINTAIN',
    "activity" "Activity" NOT NULL DEFAULT 'SEDENTARY',
    "trainingDays" INTEGER NOT NULL DEFAULT 3,
    "trainingMinutes" INTEGER NOT NULL DEFAULT 60,
    "experience" TEXT NOT NULL DEFAULT 'BEGINNER',
    "dietaryPreferences" TEXT NOT NULL DEFAULT '',
    "restrictions" TEXT NOT NULL DEFAULT '',
    "riskContext" "RiskContext" NOT NULL DEFAULT 'GENERAL',
    "calorieOverride" INTEGER,
    "proteinOverride" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_weight_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "measuredAt" TIMESTAMPTZ(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "waistCm" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "fatigue" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_weight_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eatenAt" TIMESTAMPTZ(3) NOT NULL,
    "meal" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grams" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'USER_INPUT',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbody_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "measuredAt" TIMESTAMPTZ(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "muscleKg" DOUBLE PRECISION,
    "fatKg" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "leanMassKg" DOUBLE PRECISION,
    "waterLiters" DOUBLE PRECISION,
    "bmr" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "waistHipRatio" DOUBLE PRECISION,
    "device" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbody_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscle" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sets" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" DOUBLE PRECISION,
    "restSec" INTEGER,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardio_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "averageHr" INTEGER,
    "intensity" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "calorieSource" TEXT,

    CONSTRAINT "cardio_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "body_weight_records_userId_measuredAt_idx" ON "body_weight_records"("userId", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "nutrition_days_userId_date_key" ON "nutrition_days"("userId", "date");

-- CreateIndex
CREATE INDEX "food_entries_userId_eatenAt_idx" ON "food_entries"("userId", "eatenAt");

-- CreateIndex
CREATE INDEX "inbody_records_userId_measuredAt_idx" ON "inbody_records"("userId", "measuredAt");

-- CreateIndex
CREATE INDEX "workout_sessions_userId_startedAt_idx" ON "workout_sessions"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "workout_exercises_sessionId_idx" ON "workout_exercises"("sessionId");

-- CreateIndex
CREATE INDEX "workout_sets_exerciseId_idx" ON "workout_sets"("exerciseId");

-- CreateIndex
CREATE INDEX "cardio_sessions_sessionId_idx" ON "cardio_sessions"("sessionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_weight_records" ADD CONSTRAINT "body_weight_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_days" ADD CONSTRAINT "nutrition_days_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbody_records" ADD CONSTRAINT "inbody_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_sessions" ADD CONSTRAINT "cardio_sessions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

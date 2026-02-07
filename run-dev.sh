#!/bin/bash
export DATABASE_URL="file:./dev.db"
exec npx next dev -p 5000 -H 0.0.0.0

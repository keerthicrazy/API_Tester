# Development (local) - run from project root, in two terminals
set -a; source .env.development; set +a; npm --prefix backend run dev
set -a; source .env.development; set +a; npm --prefix frontend run dev

# Production (local) - run from project root, in two terminals
set -a; source .env.production; set +a; NODE_ENV=production npm --prefix backend run start
set -a; source .env.production; set +a; npm --prefix frontend run build && npm --prefix frontend run preview -- --host --port "$FRONTEND_PORT"

# Development (docker)
ENV_FILE=.env.development ENV_MODE=development docker compose up --build

# Production (docker)
ENV_FILE=.env.production ENV_MODE=production docker compose up --build -d

# Terminal 1 — backend (from project root)
set -a; source .env.development; set +a
npm --prefix backend install
npm --prefix backend run dev

# Terminal 2 — frontend (from project root)
set -a; source .env.development; set +a
npm --prefix frontend install
npm --prefix frontend run dev
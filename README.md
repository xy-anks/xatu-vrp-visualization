# XATU VRP Visualization

An interactive Vehicle Routing Problem (VRP) visualization system for campus logistics scenarios.

## 📖 Overview

The system models campus delivery scenarios as a Capacitated Vehicle Routing Problem (CVRP), providing route optimization and visualization capabilities.

The current version focuses on backend modeling, optimization algorithms, and API services. A campus map-based interactive visualization interface is under development.

## ✨ Features 

- 🏢 Campus logistics scenario modeling
- 📦 Delivery customer and demand modeling
- 🚚 CVRP route optimization
- ⚙ Multiple solver integration
- 🔌 FastAPI backend service
- 📍 Campus data loading API
- 🗺 Interactive visualization (Developing)
- 🚛 Vehicle animation (Developing)

## 🛠️ Tech Stack

### Backend
- Python
- FastAPI

### Frontend
- React
- Leaflet

### Algorithms
- Nearest Neighbor
- Clarke-Wright Savings
- Gurobi 

## 📁 Project Structure

```
xatu-vrp-visualization/
│
├── backend/
|   ├── api/
|   ├── models/
|   ├── schemas/
|   ├── solver/
|   ├── tests/
|   ├── utils/
|   └── main.py
├── frontend/
├── data/
│   ├── raw/
|   ├── processed/
│   └── campus.json
├── docs/
|   └── model_design.md
├── assets/
├── README.md
└── requirements.txt
```

## 🚀 Development Roadmap

### Phase 1: Backend Foundation ✅
- [x] Project initialization
- [x] CVRP data models
- [x] Depot / Customer / Vehicle models
- [x] Optimization solver implementation
- [x] FastAPI backend API

### Phase 2: Visualization Interface 🚧
- [ ] React frontend
- [ ] Campus map visualization
- [ ] Route display
- [ ] Algorithm selection

### Phase 3: Simulation Enhancement
- [ ] Vehicle animation
- [ ] Dashboard
- [ ] Dynamic order generation

## 📌 Future Work
- VRP with Time Windows (VRPTW)
- Multi-depot VRP
- Dynamic order generation
- Real-time simulation
- Large-scale optimization

## 👤 Author

**Kelun Zhang**

Undergraduate Student in Logistics Management  
School of Economics and Management  
Xi'an Technological University

---

**Status:** 🚧 Backend completed, visualization in development
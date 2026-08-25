# Data Model Design

## Overview

This document describes the core data models of the campus VRP system.

The system contains four main entities:

- Station
- DeliveryPoint
- Vehicle
- VRPProblem

---

# 1. Station

## Description

Represents a campus logistics station where packages are collected and distributed.


## Attributes

| Attribute | Type | Description |
|---|---|---|
| id | int | Unique identifier |
| name | str | Station name |
| latitude | float | Latitude |
| longitude | float | Longitude |


---

# 2. DeliveryPoint

## Description

Represents a campus delivery location, such as dormitory buildings or teaching buildings.


## Attributes

| Attribute | Type | Description |
|---|---|---|
| id | int | Unique identifier |
| name | str | Building name |
| latitude | float | Latitude |
| longitude | float | Longitude |
| demand | int | Delivery demand |


---

# 3. Vehicle

## Description

Represents an electric vehicle used for campus delivery.


## Attributes

| Attribute | Type | Description |
|---|---|---|
| id | int | Vehicle identifier |
| capacity | float | Maximum load |
| speed | float | Average speed |


---

# 4. VRPProblem

## Description

Represents one vehicle routing problem instance.

It connects stations, delivery points and vehicles.


## Attributes

| Attribute | Type | Description |
|---|---|---|
| station | Station | Starting point |
| delivery_points | list | Delivery locations |
| vehicles | list | Available vehicles |
| distance_matrix | matrix | Distance between locations |

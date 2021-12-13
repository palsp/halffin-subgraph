# Halffin Subgraph

This subgraph dynamically tracks any product created by the factory. It also tracks the status of each product e.g. when there is an order or when the delivery status is updated.

# Entity Overview

## User

contain data on a specific user. it includes product owned and purchased by the user.

## Product

contain data on a specific product.

# Example Queries

This query fetches data of the first 5 products.

```gql
{
  products(first: 5) {
    id
    name
    price
    stage
    owner
    buyer
    deliveryStatus
  }
}
```

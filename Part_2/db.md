#### Companies and Warehouses

```sql
CREATE TABLE companies(
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE warehouses(
    id         SERIAL PRIMARY KEY,
    company_id INT   NOT NULL REFERENCES companies(id),
    name       TEXT  NOT NULL
);
```

#### Products(incl.bundles)

```sql

CREATE TABLE products(
id SERIAL PRIMARY KEY,
name TEXT NOT NULL,
sku TEXT NOT NULL UNIQUE,
is_bundle BOOL NOT NULL DEFAULT FALSE
);

```

#### Bundle components

```sql

CREATE TABLE bundle_items(
    bundle_id    INT NOT NULL REFERENCES products(id),
    component_id INT NOT NULL REFERENCES products(id),
    qty          INT NOT NULL DEFAULT 1,
    PRIMARY KEY(bundle_id, component_id)
);
```

#### Suppliers and their products

```sql
CREATE TABLE suppliers(
    id         SERIAL PRIMARY KEY,
    company_id INT    NOT NULL REFERENCES companies(id),
    name       TEXT   NOT NULL
);

CREATE TABLE product_suppliers(
    product_id  INT NOT NULL REFERENCES products(id),
    supplier_id INT NOT NULL REFERENCES suppliers(id),
    PRIMARY KEY(product_id, supplier_id)
);
```

#### Inventory per warehouse

```sql
CREATE TABLE inventory(
    product_id   INT NOT NULL REFERENCES products(id),
    warehouse_id INT NOT NULL REFERENCES warehouses(id),
    qty          INT NOT NULL DEFAULT 0,
    PRIMARY KEY(product_id, warehouse_id)
);
```

#### History of inventory changes

```sql
CREATE TABLE inventory_history(
    id           SERIAL PRIMARY KEY,
    product_id   INT     NOT NULL,
    warehouse_id INT     NOT NULL,
    change       INT     NOT NULL, -- +/– delta
  reason       TEXT,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

# Promotion content-type

Este content-type permite crear promociones con:

- estado manual (`isActive`)
- vigencia por fechas (`startsAt`, `endsAt`)
- condiciones (`conditions`)
- beneficios (`rewards`)

## Convención recomendada

- Si `isActive` es `false`, nunca aplica.
- Si la fecha actual está fuera de `startsAt` y `endsAt`, no aplica.
- Todas las condiciones de `conditions` deben cumplirse para aplicar la promoción.
- Todos los beneficios de `rewards` se consideran aplicables a la promoción.

## Endpoint para despachador

- `POST /api/dispatcher/promotions/resolve`

Body:

```json
{
  "customer": "customer-uuid|RFC|vehicle-uuid|fleet-uuid",
  "vehicle": null,
  "fleet": null,
  "quantity": 35.7
}
```

Respuesta:

- `applies: true|false`
- `promotion`: promoción ganadora o `null`
- `promotion.rewardSummary.estimatedDiscount`: descuento estimado total
- `promotion.rewardSummary.discountPerLiter`: descuento por litro acumulado
- `promotion.rewardSummary.effectiveDiscountPerLiter`: descuento por litro efectivo para aplicar en `load.discount`

Regla de selección:

- Se elige la promoción con mayor `estimatedDiscount`.
- Si empatan, se usa mayor `discountPerLiter`.
- Si empatan, gana menor `priority`.
- Si empatan, gana la más reciente.

## Ejemplos de carga

## 1) Todos los lunes, del 1ero de enero al 28 de febrero, +0.2 descuento por litro

- `title`: "Lunes de ahorro"
- `isActive`: `true`
- `startsAt`: `2026-01-01`
- `endsAt`: `2026-02-28`
- `conditions`:
  - `type`: `weekday`
  - `weekday`: `monday`
- `rewards`:
  - `type`: `discount_per_liter`
  - `value`: `0.2`

## 2) Todos los martes indefinidamente, doble litros

- `title`: "Martes x2 litros"
- `isActive`: `true`
- `startsAt`: `2026-01-01`
- `endsAt`: `null`
- `conditions`:
  - `type`: `weekday`
  - `weekday`: `tuesday`
- `rewards`:
  - `type`: `liters_multiplier`
  - `value`: `2`

## 3) Día de cumpleaños, 0.5 descuento por litro

- `title`: "Cumpleaños con descuento"
- `isActive`: `true`
- `startsAt`: `2026-01-01`
- `endsAt`: `null`
- `conditions`:
  - `type`: `birthday`
- `rewards`:
  - `type`: `discount_per_liter`
  - `value`: `0.5`

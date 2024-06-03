# Inprodi

1. Clonar proyecto
2. ```yarn```
3. Clonar el archivo ```.env.template``` y renombrarlo a ```.env```
4. Cambiar las variables de entorno
5. Levantar la base de datos
```
docker-compose up -d
```

6. Levantar: ```yarn dev```

7. Ejecutar SEED 
```
http://localhost:8080/api/seed
```

## Stack Usado
- TypeOrm Mysql
- NestJs

## Filters 

| Name | expression | Description | Example |
| ---| ---| --- | --- |
| Equals | $eq | Equal to | filters\[name\]\[$eq\] = Andres |
| Less than | $lt | Less than | filters\[price\]\[$lt\] = 40 |
| Less than or equal to | $lte | Less than or equal to | filters\[price\]\[$lt\] = 40 |
| Greater than | $gt | Greater than | filters\[price\]\[$gt\] = 40 |
| Greater than or equal to | $gte | Greater than or equal to | filters\[price\]\[$gte\] = 100 |
| Is one of | $in | Matches any of the values | filters\[customers\]\[id\]\[$in\] = 1 |
| Is not one of | $nin | Doesn't match any of the values | filters\[customers\]\[id\]\[$nin\] = 1 |
| Is between | $between | Is between two values (inclusive) |
| Isn't between | $nbetween | Is not between two values (inclusive) |
| Regex | $regex | Field has to match regex | filters\[name\]\[$regex\] = Andres |
# operando-api

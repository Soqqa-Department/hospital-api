# Super puper MEVN stack backend
```
------------------------------------------------




Everything you want is on the other side of fear.



------------------------------------------------
```
## Deploying that shit

1. Copy project to the server via ftp and cd to it
2. Add .env file and configure it

```bash
JWT_ACCESS_KEY = ""
JWT_REFRESH_KEY = ""
JWT_ACCESS_LIFE = "1h"
JWT_REFRESH_LIFE = "7d"
TZ = 'Asia/Tashkent'
DB_CLEANUP_INTERVAL = "46656000000"
BONUS_PERCENTAGE = 0.01

MONGO_URL="mongodb://your_user:your_pass@mongodb:27017,mongodb2:27018/HospitalDB?replicaSet=rs0&authSource=admin"
MONGO_MANAGER_KEY = 'your key'
```

3. Generate key.txt using `setup.sh` just type `bash setup.sh`
4. Set a password for mongodb inside docker-compose file (for each replica) 

5. Install docker if not installed

6. run 
```bash
sudo docker compose up -d
``` 
   - *-d here to run in the background*
7. Enter inside of mongodb container

```bash
sudo docker exec -it main-mongodb bash
```

8. Login to mongosh console
```bash
mongosh -u root -p your_pass --host localhost --port 27017 
```

9. Create initiate replica set
```bash
rs.initiate(
  {
    _id: "rs0",
    version: 1,
    members: [
      { _id: 0, host: "mongodb:27017" },
      { _id: 1, host: "mongodb2:27018" }
    ]
  }
)
```

10. Go to admin table and create user for node to use
```bash
use admin
db.createUser({
  user: "your_user",
  pwd: "your_pass", 
  roles: [ { role: "readWrite", db: "HospitalDB" } ] 
})
```

11. Reload
```bash
sudo docker compose down
sudo docker compose up -d
```

**Note that values in all steps are related to each other!!!**
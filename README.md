# testing

**This repo will be archived in favor of (1) stress testing and (2) a simple frontend demonstration!**

unit/stress/integration testing the system

remember -- your codebase should be 3/4 testing (hahahah)

```
./build.sh
./compose.sh
```

then bash shell into the frontend container, `yarn install`, (and maybe restart the container?)

## todo

- method to compare packets sent from phone **vs** packets received to ingest server
   - frontend gets status of each phone every N seconds using `[GET] phone:port/status`
   - `/status` returns `log:[]` which we need to make look like `log:[startResponse{TOKEN}, packet0, packet1, ..., stopResponse]`
   - the log contains phone packets _sent_
   - ingest-server `[GET] /log/TOKEN` returns the server log
- need some way to clean up the ruby database

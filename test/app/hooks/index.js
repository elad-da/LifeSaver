var app;
app = angular.module("{@= app_name @}");
app.config(require("./config"));
app.run(require("./run"));

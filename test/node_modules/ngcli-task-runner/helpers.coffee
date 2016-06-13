
findup = require "findup"
path = require "path"
Lineup = require "lineup"
lineup = new Lineup()
fs = require "fs"
_ = require "lodash"

class Helpers

  constructor: () ->
    @commands = []
    @hooks = []
    @tasks = []

  lineup: lineup

  ###*
    @method _terminate
    @param error {object} Error object to console
    @description Prints error and terminates process
  ###
  _terminate: (error) ->
    if error.trace
      lineup.log.error error.message,{trace:error.trace}
    else
      lineup.log.error error
    process.exit 1

  ###*
    @method _getNgConfig
    @param cb {Function} Callback to fire
    @description Reads and return ngConfig as object
  ###
  _getNgConfig: (cb) ->
    self = @
    findup process.cwd(),'ngconfig.json', (err,dir) ->
      if err
        error_string =
          message:
            'Unable to find ngconfig.json , make sure you are inside ngcli project'
          trace:
            err: err
        self._terminate error_string
        return
      else
        config_path = path.join dir,'ngconfig.json'
        config_object = fs.readFileSync config_path
        try
          config_object = JSON.parse config_object.toString()
        catch e
          error_string =
          message:
            'Unable to read ngconfig.json, possibily a corrupt file'
          trace:
            err: err
          self._terminate error_string
          return
        finally
          cb null,config_object

  ###*
    @method _getAppAddons
    @param cb {Function} Callback to fire
    @description Reads and return app addons from package.json file
  ###
  _getAppAddons: (cb) ->
    self = @
    if _.size(self.hooks) > 0 or _.size(self.tasks) > 0 or _.size(self.commands) > 0
      console.log 'pre sent'
      cb null, {hooks:self.hooks,tasks:self.tasks,commands:self.commands}
      return
    else
      findup process.cwd(),'package.json', (err,dir) ->
        if err
          error_string =
            message:
              'Unable to find package.json , make sure you are inside ngcli project'
            trace:
              err: err
          self._terminate error_string
          return
        else
          package_file = path.join dir,'package.json'
          pckg_json = require package_file
          ngAddons = pckg_json["ng-addons"]
          if _.size(ngAddons) > 0
            _.each ngAddons, (value,key) ->
              if value.indexOf('/') > -1
                addon_path = path.join dir,value
              else
                addon_path = path.join dir,"/node_modules/"+value
              addon = require addon_path
              if addon.hooks
                self.hooks.push addon.hooks
              if addon.tasks
                self.tasks.push addon.tasks
              if addon.commands
                self.commands.push addon.commands
            cb null, {hooks:_.flatten(self.hooks),tasks:_.flatten(self.tasks),commands:_.flatten(self.commands)}
            return
          else
            cb '0 configured addons',null
            return
      return

module.exports = Helpers

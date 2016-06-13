path = require "path"
broccoli = require "broccoli"
rimraf = require "rimraf"
Watcher = require "broccoli/lib/watcher"
Lineup = require "lineup"
lineup = new Lineup()
mergeTrees = require "broccoli-merge-trees"
helpers = require "broccoli-kitchen-sink-helpers"
ngCli = require "./helpers.js"
cli = new ngCli()
_ = require "lodash"

class BroccoliBuild

  ###*
    @method builder
    @param tree
    @description Takes input broccoli tree
  ###
  builder: (tree) ->
    new broccoli.Builder mergeTrees tree,{overwrite:true}

  ###*
    @method build
    @param dest
    @param tree
    @description Run build tasks for broccoli and outputs same to a destination.
  ###
  build: (dest,tree) ->
    lineup.action.info "build","Starting build process"
    builder = @.builder tree
    builder.build()
    .then (output) ->
      lineup.log.success "Build successfull"
      rimraf.sync dest
      helpers.copyRecursivelySync output.directory, dest
      return
    .catch (err) ->
      lineup.log.error err
      return
    return

  ###*
    @method readTree
    @param callback
    @description Reads ngCli addons and pull build tasks from them.
  ###
  readTree: (cb) ->
    cli._getAppAddons (err,addons) ->
      ngTasks = []
      if addons.tasks
        _.each addons.tasks, (task) ->
          ngTasks.push task.init()
        cb(null,_.flatten(ngTasks));
      else
        cb 'no build tasks found'
    return

  ###*
    @method serve
    @param tree
    @param options
    @description Serve ngCli app using broccoli serve , requires config options
  ###
  serve: (tree,options) ->
    builder = @.builder tree
    broccoli.server.serve builder,{host:options.host,port:options.port,liveReloadPort:options.lrPort}
    return

  ###*
    @method watch
    @param dest
    @param tree
    @description Watch for file changes and rebuild tasks, do not run a server.
  ###
  watch: (dest,tree) ->
    builder = @.builder tree
    watcher = new Watcher builder, { interval: 100 }
    watcher.on 'change',(results) ->
      lineup.action.info "change","Changes detected"
      rimraf.sync dest
      helpers.copyRecursivelySync results.directory, dest
      lineup.log.success "Build successfull"
      watcher.emit "livereload"
    return

  ###*
    @method run
    @param type
    @description Entrance method to this class,
      takes type [build,serve]
      reads config from ngConfig
      and invokes one of the above method
  ###
  run: (type) ->
    self = @
    ###*
      Grabs dist as the destination folder
    ###
    dist = path.join __dirname,'../../dist'
    ###*
      Reads ngConfig using ngCli helper
    ###
    cli._getNgConfig (err,config) ->
      if err
        lineup.log.error err
      else
        ###*
          Reads addons and pull all builds tasks from them using ngCli helper
        ###
        self.readTree (err,tree) ->
          if err
            lineup.log.error err
          else
            if type == 'serve'
              if config.run_server
                self.serve tree,config
              else
                self.watch dist,tree
            else
              self.build dist,tree
    return
module.exports = BroccoliBuild

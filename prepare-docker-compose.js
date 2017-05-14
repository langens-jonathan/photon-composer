var exec = require('child_process').exec;
var yaml = require('js-yaml');
var fs   = require('fs');
// first of all parse the yml file

// exec(cmd, function(error, stdout, stderr) {
//   // command output is in stdout
// });

try {
    // read in the configuration file
    var config = yaml.safeLoad(fs.readFileSync('./photon-compose.yml', 'utf8'));

    // clone the speficiation repository to ./photon
    exec("rm -rf photon && git clone " + config["specification"] + " photon", function(stdout, stderr) {});

    // create the docker-compose file contents
    var dockerComposeContents = yaml.safeDump( {
	"version":"2",
	"services": {
	    "photon": {
		"image": "photon:" + config["photon"],
		"links": [
		    "app:app",
		    "delta:db"
		],
		"ports": [
		    "3000:3000"
		]},
	    "app": {
		"image": config["image"] + ":" + config["tag"],
		"volumes": config["volumes"],
		"links": [
		    "delta:db"
		]},
	    "db": {
		"image": "tenforce/virtuoso:1.0.0-virtuoso7.2.4",
		"environment": {
		    "SPARQL_UPDATE":"true",
		    "DEFAULT_GRAPH":"http://mu.semte.ch/application" },
		"ports": [ "8890:8890" ]},
	    "delta": {
		"image": "semtech/mu-delta-service:beta-0.9",
		"ports": [ "9980:8890" ],
		"volumes": [ "./config/delta:/config" ],
		"environment": {
		    "CONFIGFILE": "/config/config.properties",
		    "SUBSCRIBERSFILE": "/config/subscribers.json"
		},
		"links": [
		    "db:db"
		]
	    },
	}});

    // write the docker-compose file in the photon (test specification) directory
    fs.writeFile("photon/docker-compose.yml", dockerComposeContents, function(err) {
	if(err) {
            return console.log(err);
	}});

    // copy the delta configurationf files to the photon directory
    exec("mkdir -p photon/config && cp config/config.properties photon/config/config.properties", function(stdout, stderr) {});

    // create the subscribers JSON it's seems a bit overkill to add a JSON library just for this
    // file as the file will always look a like this.
    var subscribersJson = "{\\\"potentials\\\":[";
    if(config["delta"]["potentials"] !== undefined && config["delta"]["potentials"] !== "" && config["delta"]["potentials"] !== null)
    {
	subscribersJson += "\\\"http://app" + config["delta"]["potentials"] + "\\\"";
    }
    subscribersJson += "],\\\"effectives\\\":[";
    if(config["delta"]["effectives"] !== undefined && config["delta"]["effectives"] !== "" && config["delta"]["effectives"] !== null)
    {
	subscribersJson += "\\\"http://app" + config["delta"]["effectives"] + "\\\"";
    }
    subscribersJson += "]}";

    // write the docker-compose file in the photon (test specification) directory
    exec("echo \"" + subscribersJson + "\" >> photon/config/subscribers.json", function(stdout, stderr) {});
} catch (e) {
  console.log(e);
}

var request = require("request")
var retry = require('retry')

function sendTicksAndRetryOnFailure(tickUrl, meterName, ticks, retryConfig, callback) {
  //Using 'retry', a nifty package that handles retry automatically.
  //See https://github.com/tim-kos/node-retry
  const operation = retry.operation(retryConfig)

  operation.attempt(function(currentAttempt) {
    console.log("(attempt #" + currentAttempt + ")")
    sendTicks(tickUrl, meterName, ticks, function(err, responseBody) {
      console.log("sentTicks callback called", err)

      if (operation.retry(err)) {
        return
      }
      if (err) {
        console.log("Failed all attempts to send ticks", ticks)
        callback(operation.mainError(), responseBody)
      } else {
        console.log("Sent ticks", ticks, " and got response ", responseBody)
        callback(null, responseBody)
      }
    })
  });
}

function sendTicks(tickUrl, meterName, ticks, callback) {
  var payload = {
    "meterName": "" + meterName,
    "ticks": ticks
  }
  var options = {
    uri: tickUrl,
    method: 'POST',
    json: payload
  }

  request(options, function(error, response, body) {
    if (error) {
      console.log("Got error: ", error)
      callback(error)
      return
    }
    if (response.statusCode < 200 || response.statusCode > 299) {
      callback("Got status code " + response.statusCode + ":" + response.statusMessage)
      return
    }
    callback(null, body)
  })
}

module.exports.sendTicksAndRetryOnFailure = sendTicksAndRetryOnFailure
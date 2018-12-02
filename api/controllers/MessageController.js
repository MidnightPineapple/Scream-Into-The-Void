/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
    subscribe: function(req,res) {
        if(!req.isSocket) { return res.badRequest }
        sails.sockets.join(req.socket, "message-feed")
        return res.ok();
    }
};


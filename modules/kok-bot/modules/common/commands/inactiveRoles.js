"use strict";
const logger = require('../../../../logger');
const reqAccess = require('../reqAccess');
const responseDict = require('../responseDict');
const inactiveTracker = require('../../inactive-tracker');
const help = require("./help");

module.exports = new InactiveTrackerCommands();

function InactiveTrackerCommands() {

    this.exec = (msg, commandArguments) => {
        let argsArray = [];
        if (commandArguments.length !== 0) {
            argsArray = commandArguments.split(" ");
        }
        if (argsArray.length > 0) {
            let command = argsArray[0].toLowerCase();

            if (this[command]) {
                this[command](msg, argsArray)
            } else {
                msg.channel.send("Unknown command");
            }
        } else {
            msg.channel.send(responseDict.noParams());
        }
    }

    this.add = (msg, argsArray) => {
        if (argsArray.length === 2) {
            reqAccess(msg.guild, msg.member, 3)
                .then(() => {
                    let inactiveRoleID = argsArray[1];
                    let thisGuild = msg.guild;
                    return inactiveTracker.inactives.add(inactiveRoleID, thisGuild);
                })
                .then(() => msg.channel.send(responseDict.success()))
                .catch(err => {
                    logger.log(err);
                    msg.channel.send(responseDict.fail());
                })
        } else if (argsArray.length > 2) {
            msg.channel.send(responseDict.tooManyParams());
        } else {
            msg.channel.send(responseDict.noParams());
        }
    }

    this.remove = (msg, argsArray) => {
        if (argsArray.length === 1) {
            reqAccess(msg.guild, msg.member, 3)
                .then(() => {
                    let inactiveRoleID = argsArray[1];
                    let thisGuild = msg.guild;
                    return inactiveTracker.inactives.remove(thisGuild);
                })
                .then(() => msg.channel.send(responseDict.success()))
                .catch(err => {
                    logger.log(err);
                    msg.channel.send(responseDict.fail());
                })
        } else if (argsArray.length > 1) {
            msg.channel.send(responseDict.tooManyParams());
        } else {
            msg.channel.send(responseDict.noParams());
        }
    }

    this.list = (msg, argsArray) => {
        if (argsArray.length === 1) {
            reqAccess(msg.guild, msg.member, 3)
                .then(() => inactiveTracker.inactives.list(msg.guild.id))
                .then(res => {
                    if (res) {
                        msg.channel.send(res)
                            .catch(err => logger.log(err));
                    } else {
                        msg.channel.send(responseDict.fail())
                            .catch(err => logger.log(err));
                    }
                })
                .catch(err => {
                    logger.log(err);
                    msg.channel.send(responseDict.fail())
                        .catch(err => logger.log(err));
                })
        } else {
            msg.channel.send(responseDict.tooManyParams());
        }
    }
}

let helpMessage = "Adds,Removes the specified role as the inactive role or lists the inactive role";
let template = "inactiveroles <add|remove|list> <role Id>";
let example = [
    "`-inactiveroles add 1234567890`",
    "`-inactiveroles remove 1234567890`",
    "`-inactiveroles list`"];

help.AddHelp("inactiveroles", helpMessage, template, example);
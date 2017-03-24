const reqAccess = require("../reqAccess");
const responseDict = require('../responseDict');
const help = require("./help");
const guildModel = require('../../../../../models/discord-guild');
const client = require('../client');

//using this map to provide a private method that 
//the other methods can access, but that cannot be called
//through bot commands in Discord
const sendWelcome = new WeakMap();

class Welcome {

    constructor() {
        sendWelcome.set(this, (channel, user, message) => {
            //known substitutions should be added below, anything else will get treated as a normal string
            message = message.replace(/\${user}/ig, `${user}`);
            //send message
            channel.sendMessage(message);
        })

        client.on("guildMemberAdd", member => {
            guildModel.findOne({ guildID: member.guild.id })
                .then(guild => {
                    if (guild && guild.welcomeMessage && guild.frontDeskChannelID) {
                        let welcomeChannel = member.guild.channels.get(guild.frontDeskChannelID);
                        sendWelcome.get(this)(welcomeChannel, member.user, guild.welcomeMessage);
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        })
    }

    exec(msg, args) {
        if (args.length > 0) {
            args = args.split(" ");
            let command = args[0].toLowerCase();

            if (this[command]) {
                this[command](msg, args);
            } else {
                msg.channel.sendMessage("Unknown command");
            }
        } else {
            msg.channel.sendMessage(responseDict.noParams());
        }

    }

    add(msg, args) {
        if (args.length > 2) {
            console.log(args);
            let newWelcomeChannel = args[1];
            let newWelcomeMessage = args.slice(2).join(" ");
            if (msg.guild.channels.has(newWelcomeChannel)) {
                guildModel.findOneAndUpdate({ guildID: msg.guild.id }, {
                    welcomeMessage: newWelcomeMessage,
                    frontDeskChannelID: newWelcomeChannel
                }).then(guild => {
                    if (guild) {
                        msg.channel.sendMessage(responseDict.success());
                    } else {
                        console.log('Guild not found');
                        msg.channel.sendMessage(`Failed to save this change`);
                    }
                }).catch(err => {
                    console.log(err);
                    msg.channel.sendMessage(responseDict.fail());
                })
            } else {
                console.log(`Unknown channel: ${newWelcomeChannel}`);
                console.log(`All channels: ${msg.guild.channels}`);
                msg.channel.sendMessage("Unknown channel");
            }
        } else {
            msg.channel.sendMessage(responseDict.noParams());
        }
    }

    remove(msg, args) {
        guildModel.findOneAdUpdate({ guildID: msg.guild.id }, {
            welcomeMessage: undefined,
            frontDeskChannelID: undefined
        }).then(guild => {
            msg.channel.sendMessage(responseDict.success());
        }).catch(err => {
            console.log(err);
            msg.channel.sendMessage(responseDict.fail());
        })
    }

    show(msg, args) {
        guildModel.findOne({ guildID: msg.guild.id })
            .then(guild => {
                if ( guild && guild.welcomeMessage && guild.frontDeskChannelID) {
                    sendWelcome.get(this)(msg.channel, msg.member, guild.welcomeMessage);
                    msg.channel.sendMessage(`This welcome message will be sent to ${msg.guild.channels.get(guild.frontDeskChannelID)}`);
                } else {
                    console.log(guild);
                    msg.channel.sendMessage(`Welcome message not set`);
                }
            })
            .catch(err => {
                console.log(err);
                msg.channel.sendMessage(responseDict.fail());
            })
    }

}

let helpMessage = "welcome <add|remove|show> <channel> <message> - Adds,Removes or Shows the welcome message for this Guild.";
help.AddHelp("welcome", helpMessage);

module.exports = new Welcome();
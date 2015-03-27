var relay;
var cache = {};
var namecolorlist = ['#5811b1', '#399bcd', '#0474bb', '#f8760d', '#a00c9e', '#0d762b', '#5f4c00', '#9a4f6d', '#d0990f', '#1b1390', '#028678', '#0324b1'];

function init()
{
	$(".serverList-container").show(); // show this initially, the others are hidden in the css
	relay = new Relay("server.pokemon-online.eu:10508", handleOpen, handleMessage, handleClose, handleError);
	
	$("#serverInput-back").click(function() { switchTo(".serverList-container"); });
	$("#serverInput-connect").click(function() { connectToServer(); });
	
	$(".nav-channels").click(function() { 
		if ($(".client-channels").is(":visible"))
		{
			clientSwitchTo(".client-chat");
		}
		else
		{
			clientSwitchTo(".client-channels"); 
		}
	});
	
	$(".nav-users").click(function() {
		if ($(".client-users").is(":visible"))
		{
			clientSwitchTo(".client-chat");
		}
		else
		{
			clientSwitchTo(".client-users");
		}
	});
	
	cache.chatItems = {};
	cache.myChannels = [];
	cache.pmChatItems = {};
	cache.myPms = [];
	cache.usersByName = {};
	cache.usersById = {};
	cache.channelUsers = {};
	cache.users = {};
	cache.myInfoReceived = false;
	cache.myAdded = false;
	cache.waitingOnUsers = [];
}

function connectToServer()
{
	cache.name = $("#serverInput-name").get(0).value;
	cache.color = $("#serverInput-color").get(0).value;
	
	var ip = $("#serverInput-ip").get(0).value;
	ip = (ip.contains(" - ") ? ip.substr(ip.lastIndexOf(" - ") + 3) : ip);
	
	relay.send("connect", ip);
}

function handleOpen()
{
	
}

function handleMessage(msg)
{
	var text = msg.data.toString();
	var command = text.split("|")[0];
	var data = (text.contains("|") ? text.substr(text.indexOf("|") + 1) : undefined);
	//console.log(msg);
	
	if (commandHandlers.hasOwnProperty(command))
	{
		commandHandlers[command](data);
	}
}

function handleClose()
{
	alert("Connection closed. Please refresh the page. If this fails, the registry/server may be down.");
}

function handleError(data)
{
	console.log(data);
}

var commandHandlers =
{
	"defaultserver": function(data) // data is default ip
	{
		relay.send("registry"); // request registry
	},
	"servers": function(data) // json - description, ip, locked, max?, name, num, port
	{
		//console.log("making");
		var servers = JSON.parse(data);
		cache.servers = servers;
		
		var listed = [];
		var items = [];
		
		for (var i = 0; i < servers.length; i++)
		{
				var server = servers[i];
				
				if (listed.length === 0)
				{
					listed.push(server);
				}
				else
				{
						var push = true;
						
						for (var j = 0; j < listed.length; j++)
						{
								if (server.num > listed[j].num)
								{
									listed.insert(j, server);
									push = false;
									break;
								}
						}
						
						if (push)
						{
								listed.push(server);
						}
				}
		}
		
		for (var i = 0; i < listed.length; i++)
		{
			var server = listed[i];
			var item = document.createElement("div");
			item.className = "serverListItem";
			item.server = server;
			
			var name = document.createElement("div");
			name.className = "serverListItemName";
			$(name).html(escapeHTML(server.name));
			
			var num = document.createElement("div");
			num.className = "serverListItemNum";
			$(num).html(server.num + (server.hasOwnProperty("max") ? " / " + server.max : ""));
			
			$(item).append(name);
			$(item).append(num);
			$(item).click(function() { itemClicked(this); });
			items.push(item);
		}
		
		for (var i = 0; i < items.length; i++)
		{
			$(".serverList-container").append(items[i]);
		}
	},
	"connected": function(data)
	{
		var login = { version: 1 };
		login.default =  ""; //getVal("defaultChannel", "");
		login.autojoin = getVal("autojoinChannels", []);
		login.ladder = getVal("ladderEnabled", true);
		login.idle = getVal("idle", false);
		login.color = cache.color;
		login.name = cache.name;
		
		relay.send("login", login);
	},
	"challenge": function(data)
	{
		var genHash = function(pass, salt)
		{
			return md5(md5(pass) + salt);
		};
		
		var pass = $("#serverInput-pass").get(0).value;
		
		if (pass)
		{
			relay.send("auth", { "hash": genHash(pass, data) });
		}
	},
	"login": function(data)
	{
		cache.info = JSON.parse(data);
		
		clientSwitchTo(".client-chat");
		switchTo(".client-container");
		
		cache.usersById[cache.info.id] = cache.name;
		cache.usersByName[cache.name] = cache.info.id;
	},
	"channels": function(data)
	{
		data = JSON.parse(data);
		
		createChannelsFromJSON(data);
		joinChannel(0);
	},
	"newchannel": function(data)
	{
		data = JSON.parse(data);
		createChannel(data.name, data.id);
	},
	"removechannel": function(data) // id
	{
		removeChannel(parseInt(data));
	},
	"chat": function(data)
	{
		data = JSON.parse(data);
		var ts = timestamp();
		data.message = data.message.replace(/\<timestamp([^\>]+|)\>(\s?)/i, ts + " ");
		
		if (data.message.contains(": ") && !data.html)
		{
			var name = data.message.split(": ")[0];
			var message = data.message.substr(data.message.indexOf(": ") + 2);
			var toPrint = "";
			
			if (name === "Welcome Message")
			{
				toPrint = "<span class='chat-welcome'>%1 <b>%2:</b></span> %3".args(ts, name, message);
			}
			else if (name === "~~Server~~")
			{
				toPrint = "<span class='chat-server'>%1 <b>%2:</b></span> %3".args(ts, name, message);
			}
			else if (userId(name) === -1)
			{
				toPrint = "<span class='chat-script'>%1 <b>%2:</b></span> %3".args(ts, name, message);
			}
			else
			{
				toPrint = "<span class='chat-player' style='color:%4;'>%1 <b>%2:</b></span> %3".args(ts, name, message, user(userId(name)).color);
			}
			
			print(toPrint, data.channel);
		}
		else
		{
			var before = "";
			var after = "";
			var before2 = "";
			var after2 = "";
			
			if (data.message.startsWith("***"))
			{
				before = "<span class='chat-action'>";
				after = "</span>";
				before2 = "<b>";
				after2 = "</b>";
			}
			else if (data.message.startsWith("\u00BB\u00BB\u00BB"))
			{
				before = "<span class='chat-border'>";
				after = "</span>";
				before2 = "<b>";
				after2 = "</b>";
			}
			
			print(before + (data.html ? data.message : (data.message === "" ? "" : ts + " " + before2 + escapeHTML(data.message) + after2)) + after, data.channel);
		}
	},
	"pm": function(data)
	{
		var ts = timestamp();
		data = JSON.parse(data);
		var message = escapeHTML(data.message);
		var src = data.src;
		var name = userName(src);
		
		if (!cache.myPms.contains(src))
		{
			joinedPm(src);
		}
		
		var toPrint = "<span class='chat-player' style='color:%4;'>%1 <b>%2:</b></span> %3".args(ts, name, message, user(src).color);
		
		printPm(toPrint, src);
	},
	"channelplayers": function(data)
	{
		data = JSON.parse(data);
		
		setChannelUsers(data.channel, data.players);
		cache.channelUsers[data.channel] = data.players;
	},
	"join": function(data)
	{
		var channel = data.split("|")[0];
		var user = parseInt(data.split("|")[1]);
		
		if (user === cache.info.id)
		{
			joinedChannel(channel);
		}
		
		if (user !== cache.info.id || cache.myInfoReceived)
		{
			addChannelUser(channel, user);
		}
	},
	"leave": function(data)
	{
		var channel = parseInt(data.split("|")[0]);
		var user = parseInt(data.split("|")[1]);
		
		if (user == cache.info.id)
		{
			unjoinedChannel(channel);
		}
		
		removeChannelUser(channel, user);
	},
	"players": function(data)
	{
		var updates = JSON.parse(data);
		
		for (var x in updates)
		{
			if (updates.hasOwnProperty(x))
			{
				if (x == cache.info.id)
				{
					cache.myInfoReceived = true;
				}
				
				cache.usersById[x] = updates[x].name;
				cache.usersByName[updates[x].name] = x;
				
				cache.users[x] = updates[x];
				
				if (!cache.users[x].color)
				{
					cache.users[x].color = namecolorlist[parseInt(x) % namecolorlist.length];
				}
				
				var items = $(".channel-player-item-" + x);
			}
		}
		
		if (cache.myInfoReceived && !cache.myAdded)
		{
			cache.myAdded = true;
			for (var i = 0; i < cache.myChannels.length; i++)
			{
				addChannelUser(cache.myChannels[i], cache.info.id);
			}
		}
	}
};

function itemClicked(item)
{
	var server = item.server;
	$("#serverName").html(escapeHTML(server.name));
	$("#serverDescription").html(server.description);
	$("#serverInput-ip").get(0).value = server.ip + ":" + server.port;
	
	switchTo(".serverInfo-container");
}

function switchTo(layer, dir)
{
	if (dir === undefined)
	{
		$(".client-content > div:visible").hide();
		$(layer).show();
	}
	else
	{
		var o = (dir === "left" ? "right" : (dir === "up" ? "down" : (dir === "right" ? "left" : "up")));
		$(".client-content > div:visible").hide("slide", { "direction": o }, function() { $(layer).show("slide", { "direction": dir }); });
	}
}

function clientSwitchTo(layer, dir)
{
	if (dir === undefined)
	{
		$(".client-container > div:visible").hide();
		$(layer).show();
	}
	else
	{
		var o = (dir === "left" ? "right" : (dir === "up" ? "down" : (dir === "right" ? "left" : "up")));
		$(".client-container > div:visible").hide("slide", { "direction": o }, function() { $(layer).show("slide", { "direction": dir }); });
	}
}

function userId(name)
{
	if (!cache.usersByName.hasOwnProperty(name))
	{
		return -1;
	}
	
	return cache.usersByName[name];
}

function userName(id)
{
	return cache.usersById[id];
}

function user(id)
{
	return cache.users[id];
}
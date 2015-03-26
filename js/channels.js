function createChannelsFromJSON(data)
{
	var items = [];
	cache.channelsById = [];
	cache.channelsByName	= [];
	
	for (var x in data)
	{
		// x is index/id, data[x] is name
		if (data.hasOwnProperty(x))
		{
			cache.channelsById[x] = data[x];
			cache.channelsByName[data[x]] = x;
			items.push(channelItem(data[x], x, "channelListItem"));
		}
	}
	
	items.sort(function(a, b)
	{
		return a.cname.toLowerCase().localeCompare(b.cname.toLowerCase());
	});
	
	$("#client-channels-allChannels").empty();
	$("#client-channels-allChannels").append(items);
}

function createChannel(name, id)
{
	// need to do alphabet
	
	cache.channelsById[id] = name;
	cache.channelsByName[name] = id;
	
	$("#client-channels-allChannels").append(channelItem(name, id, "channelListItem"));
}

function removeChannel(id)
{	
	unjoinedChannel(id);
	delete cache.channelsByName[channelName(id)];
	delete cache.channelsById[id];
	delete cache.channelUsers[id];
}

function setChannelUsers(channel, users)
{
	cache.channelUsers[channel] = users;
}

function addChannelUser(channel, user)
{
	if (!cache.channelUsers.hasOwnProperty(channel))
	{
		cache.channelUsers[channel] = [];
	}
	
	cache.channelUsers[channel].push(user);
	
	// make item
}

function removeChannelUser(channel, user)
{
	if (!cache.channelUsers.hasOwnProperty(channel))
	{
		console.log("doesnt have users");
		return;
	}
	
	cache.channelUsers[channel].remove(user);
	
	// remove item
}

function channelName(id)
{
	return cache.channelsById[id];
}

function channelId(name)
{
	return cache.channelsByName[name];
}

function joinChannel(id)
{
	if (cache.myChannels.contains(id))
	{
		switchToChannel(id);
		return;
	}
	
	relay.send("join", channelName(id));
}

function unjoinChannel(id)
{
	relay.send("leave", id);
}

function joinedChannel(id)
{
	if (cache.myChannels.contains(id))
	{
		switchToChannel(id);
		return;
	}
	
	$("#client-channels-myChannels").append(channelItem(channelName(id), id, "myChannelItem"));
	cache.myChannels.push(id);
	
	var c = new chatItem(id);
	$(".client-chat").append(c.container);
	cache.chatItems[id] = c;
	
	switchToChannel(id);
}

function unjoinedChannel(id)
{
	if (!cache.myChannels.contains(id))
	{
		return;
	}
	
	$("#myChannelItem" + id).get(0).delete();
	cache.myChannels.remove(id);
	
	if (cache.myChannels.length > 0)
	{
		switchToChannel(cache.myChannels[0]);
	}
}

function switchToChannel(id)
{
	if (!cache.myChannels.contains(id))
	{
		joinChannel(id);
		return;
	}

	$(".chatItem-container").hide();
	$("#chatItem-container" + id).show();
	$(".nav-header").html(escapeHTML(channelName(id)));
}

function channelItem(name, id, classBase)
{	
	var d = document.createElement("li");
	d.className = classBase;
	$(d).html(escapeHTML(name));
	d.id = classBase + id;
	d.cid = id;
	d.cname = name;
	
	$(d).click(function()
	{
		switchToChannel(id);
		clientSwitchTo(".client-chat");
	});
	
	return d;
}

function chatItem(id)
{
	this.id = id;
	var self = this;
	
	var container = document.createElement("div");
	container.className = "chatItem-container";
	container.id = "chatItem-container" + id;
	
	var chat = document.createElement("div");
	chat.className = "chatItem-chat";
	chat.id = "chatItem-chat" + id;
	
	var text = document.createElement("input");
	text.type = "text";
	text.className = "form-control si chatItem-text flatbox";
	text.id = "chatItem-text" + id;
	
	var send = document.createElement("button");
	send.className = "btn btn-large btn-primary chatItem-send";
	send.id = "chatItem-send" + id;
	send.innerHTML = "Send";
	
	$(container).append(chat).append(text).append(send);
	
	this.sendText = function()
	{
		if (!self.text.value)
		{
			return;
		}
		
		relay.send("chat", { channel: self.id, message: self.text.value });
		self.text.value = "";
	};
	
	this.appendChat = function(content)
	{
		$(self.chat).append(content + "<br />");
		scrollToBottom(self.chat);
	};
	
	$(send).click(self.sendText);
	
	$(text).keypress(function(e)
	{
		if (e.which === 13)
		{
			self.sendText();
		}
	});
	
	this.container = container;
	this.chat = chat;
	this.text = text;
	this.send = send;
}

function print(msg, channel)
{
	if (channel === -1)
	{
		var c = cache.myChannels;
		
		for (var i = 0; i < c.length; i++)
		{
			cache.chatItems[c[i]].appendChat(msg);
		}
	}
	else
	{
		cache.chatItems[channel].appendChat(msg);
	}
}
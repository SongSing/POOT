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
			items.push(channelItem(data[x], x, "channelListItem", chanFn(x)));
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
	cache.channelsById[id] = name;
	cache.channelsByName[name] = id;
	var item = channelItem(name, id, "channelListItem", chanFn(id));
	
	var names = valuesOf(cache.channelsById);
	names.push(name);
	names = names.alphabetize();
	
	var i = names.indexOf(name);
	
	var l = $("#client-channels-allChannels");
	
	if (i === 0)
	{
		l.prepend(item);
	}
	else
	{
		$("#channelListItem" + channelId(names[i - 1])).after(item);
	}
}

function removeChannel(id)
{	
	unjoinedChannel(id);
	$("#channelListItem" + id).get(0).delete();
	delete cache.channelsByName[channelName(id)];
	delete cache.channelsById[id];
	delete cache.channelUsers[id];
}

function setChannelUsers(channel, users) // users is array of ids
{
	cache.channelUsers[channel] = users;
	
	var l = $("#userList" + channel);
	
	if (l.get(0))
	{
		fillUserList(channel, users);
	}
	else
	{
		cache.waitingOnUsers.push(channel);
	}
}

function fillUserList(channel, users)
{
	var l = $("#userList" + channel);
	var names = [];
	l.empty();
	
	for (var i = 0; i < users.length; i++)
	{
		names.push(userName(users[i]));
	}
	
	names.alphabetize();
	
	for (i = 0; i < names.length; i++)
	{
		var item = userItem(userId(names[i]), channel);
		l.append(item);
	}
}

function addChannelUser(channel, user)
{
	if (!cache.channelUsers.hasOwnProperty(channel))
	{
		cache.channelUsers[channel] = [];
	}
	
	cache.channelUsers[channel].push(user);
	
	var item = userItem(user, channel);
	var name = userName(user);
	var ids = valuesOf(cache.channelUsers[channel]);
	var names = [];
	
	for (var i = 0; i < ids.length; i++)
	{
		names.push(userName(ids[i]));
	}
	
	names.alphabetize();
	names.push(name);
	
	var i = names.indexOf(name);
	
	var l = $("#userList" + channel);
	
	if (i === 0)
	{
		l.prepend(item);
	}
	else
	{
		$("#userItem" + userId(names[i - 1]) + "-" + channel).after(item);
	}
}

function removeChannelUser(channel, user)
{
	if (!cache.channelUsers.hasOwnProperty(channel))
	{
		console.log("doesnt have users");
		return;
	}
	
	cache.channelUsers[channel].remove(user);
	
	$("#userItem" + user + "-" + channel).get(0).delete();
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
	id = parseInt(id);
	if (cache.myChannels.contains(id))
	{
		switchToChannel(id);
		return;
	}
	
	var item = channelItem(channelName(id), id, "myChannelItem", chanFn(id));
	
	var close = document.createElement("div");
	close.className = "myChannelItem-close";
	close.innerHTML = "Leave";
	
	$(close).click(function(e)
	{
		e.stopPropagation(); // so doesnt go through
		unjoinChannel(id);
	});
	
	$(item).append(close);
	
	$("#client-channels-myChannels").append(item);
	cache.myChannels.push(id);
	
	var c = new chatItem(id);
	$(".client-chat").append(c.container);
	cache.chatItems[id] = c;
	
	var userList = document.createElement("div");
	userList.className = "userList";
	userList.id = "userList" + id;
	$(".client-users").append(userList);
	
	if (cache.waitingOnUsers.contains(id))
	{
		cache.waitingOnUsers.remove(id);
		fillUserList(id, cache.channelUsers[id]);
	}
	
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

	hideChannels();
	hidePms();
	hideUserLists();
	
	$("#chatItem-container" + id).show();
	scrollToBottom($("#chatItem-chat" + id).get(0));
	$("#userList" + id).show();
	$(".nav-header").html(escapeHTML(channelName(id)));
}

function hideChannels()
{
	$(".chatItem-container").hide();
}

function hideUserLists()
{
	$(".userList").hide();
}

function chanFn(id)
{
	return function()
	{
		switchToChannel(id);
		clientSwitchTo(".client-chat");
	}
}

function channelItem(name, id, classBase, fn)
{	
	var d = document.createElement("li");
	d.className = classBase;
	$(d).html(escapeHTML(name));
	d.id = classBase + id;
	d.cid = id;
	d.cname = name;
	
	$(d).click(fn);
	
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
		var s = document.createElement("span");
		$(s).html(content);
		s.className = "printed-message";
		
		$(self.chat).append(s);
		$(self.chat).append("<br />");
		
		var len = $(self.chat.id + " > .printed-message").length;
		var max = 200;
		
		if (len > max)
		{
			$(self.chat).find(".printed-message").first().delete(); // so not 8938923892892839283892 spans
		}
		
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

function currentChat()
{
	return $(".client-chat > div:visible").get(0);
}

function userItem(id, cid)
{
	var ret = document.createElement("div");
	ret.innerHTML = escapeHTML(userName(id));
	$(ret).css({ "color": user(id).color, "font-weight": "bold" });
	ret.className = "userItem userItem" + id; // can eliminate all at once if need be by using the class since they can be in multiple channels
	ret.id = "userItem" + id + "-" + cid;
	
	$(ret).click(function()
	{
		joinedPm(id);
		clientSwitchTo(".client-chat");
	});
	
	return ret;
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
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
			items.push(channelItem(data[x], x));
		}
	}
	
	items.sort(function(a, b)
	{
		return a.cname.toLowerCase().localeCompare(b.cname.toLowerCase());
	});
	
	$("#client-channels-allChannels").empty();
	$("#client-channels-allChannels").append(items);
}

function channelItem(name, id)
{	
	var d = document.createElement("li");
	d.className = "channelListItem";
	$(d).html(escapeHTML(name));
	d.id = "channelListItem" + id;
	d.cid = id;
	d.cname = name;
	
	return d;
}
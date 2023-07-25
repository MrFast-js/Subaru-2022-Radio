var radioTypes = document.getElementsByClassName('radioButton');
var radioChannels = document.getElementsByClassName('bottomButton');

var activeRadioType = "FM";
var currentStation = "Top 40";
var selectedGradient = 'linear-gradient(to bottom, #20C4F1, #0182C8)';
var radioOrder = ["G105", "Hits", "Top Mix", "Rock", "Hold", "Hold"];
var radioIndex = 0;
var volume = 0.8;
var mouseDownTime = 0;
var scrollNumber = 12;

var mouseDown = false;
var browseMenu = false;

var mouseDownTimer;
var currentSongInfo;
var currentSong;
var retur;

function $(a) {
	return document.getElementById(a);
}

document.onkeydown = function(e) {
  if(e.key == 'ArrowRight') {
    radioIndex = Math.min(radioOrder.length,radioIndex+1);
    currentStation = radioOrder[radioIndex];
    loadSource(getStationFromID(currentStation));
  }
  if(e.key == 'ArrowLeft') {
    radioIndex = Math.max(0,radioIndex-1);
    currentStation = radioOrder[radioIndex];
    loadSource(getStationFromID(currentStation));
  }
}

// Document/window Functions
document.onclick = function() {
	$('overlay').style = "visibility:hidden";
  if (!currentSong) {
		loadSource(getStationFromID(currentStation));
	}
};

document.onmousedown = function() {
	mouseDown = true;
	mouseDownTimer = setInterval(function() {
		mouseDownTime++;
	}, 100)
}

document.onmouseup = function() {
	mouseDown = false;
	mouseDownTime = 0;
	clearInterval(mouseDownTimer);
}

document.onmousewheel = function(e) {
	if (browseMenu) return;
  console.log(e.deltaY)
	if (e.deltaY >= 0 && scrollNumber >= 1) scrollNumber--;
	else if (scrollNumber < 38 && e.deltaY<0) {
    scrollNumber++;
  }

	setAudioBar(scrollNumber)
}

window.onload = function() {
  loadSource(getStationFromID(currentStation));
  
  // Set the contents of the bottom bar to what it is saved as
	if (!localStorage.radioOrder) {
		localStorage.radioOrder = JSON.stringify(radioOrder);
	} else {
		radioOrder = JSON.parse(localStorage.radioOrder);
		currentStation = radioOrder[0];
		for (var i = 0; i < radioOrder.length; i++) {
			var element = document.getElementsByClassName('bottomButton')[i]
			element.id = radioOrder[i];
			element.innerHTML = radioOrder[i];
		}
	}
}

setTimeout(async function() {
  // Add functionality to stations at bottom
	for (var i = 0; i < radioChannels.length; i++) {
		radioChannels[i].onclick = function(event) {
			browseMenu = false;
			if (event.target.id == currentStation) return;
			try {
				currentSong.pause()
			} catch (error) {}
			currentStation = event.target.id;
			loadSource(getStationFromID(event.target.id));
		}
	}
  
	var count = 0;
  
  // Add stations to the browse menu
	for (var thing in RADIO_STATION) {
		var station = RADIO_STATION[thing]
		await getHTML(station.url);

		count++;

		$('temp').innerHTML = retur;
		var imageURL = JSON.parse($('initial-props').innerHTML).initialProps.imageUrl;
		var bugged = count > getLength(RADIO_STATION) - 4;
    var bugged2 = count > getLength(RADIO_STATION)-4;
    
		$('BrowseScroll').innerHTML += `
    <div class="optionTest" bugged2="${bugged2}" bugged="${bugged}">
      <img class="optionIMG" src="${imageURL}"></img>
      <option class="option">${station.id}</option>
    </div>
    `
		$('temp').innerHTML = '';
	}
  
  // Add functionality to the stations inside browse menu
	var options = document.getElementsByClassName('optionTest');
	for (var i = 0; i < options.length; i++) {
		options[i].onclick = function(event) {
			browseMenu = !browseMenu;
			try {
				currentSong.pause()
			} catch (error) {}
			console.log(event.path[1].children[1].innerHTML)
			currentStation = event.path[1].children[1].innerHTML;
			loadSource(getStationFromID(event.path[1].children[1].innerHTML));
		}
	}
},100);


// Returns the length of an key-value list
function getLength(list) {
	var amount = 0;
	for (var thing in list) {
		amount++;
	}
	return amount;
}

// Run the loop function every 10ms
setInterval(function() {
	loop()
}, 10)

// Loop to update visuals
function loop() {
	radioTypes[0].style = 'background: ' + selectedGradient;
	updateActiveRadioType();

	if (currentSong)
		currentSong.volume = volume;

  // Make it snow if christmas station
	if (currentStation == "Christmas") $('snowingGIF').style = 'visibility: visible'
	else $('snowingGIF').style = 'visibility: hidden'

  // Set station if mouse is held down
	if (mouseDownTime >= 12) {
		if (document.activeElement.className == "bottomButton") {
			if (radioOrder.includes(currentStation)) return;

      // Beep noise
			var aud = new Audio('https://www.pacdv.com/sounds/interface_sound_effects/beep-3.wav');
			aud.playbackRate = 0.1;
			aud.play();
      
			radioOrder[radioOrder.indexOf(document.activeElement.id)] = currentStation;
			localStorage.radioOrder = JSON.stringify(radioOrder);

			document.activeElement.id = currentStation;
			document.activeElement.innerHTML = currentStation;
			mouseDownTime = 0;
			clearInterval(mouseDownTimer)
		}
	}

  // Hide/show browse menu
	if (browseMenu) {
		$('BrowseMenu').style = 'visibility: visible'
	} else {
		$('BrowseMenu').style = 'visibility: hidden'
	}
}

// Update the selected radio station along the bottom bar
function updateActiveRadioType() {
	for (var i = 0; i < radioChannels.length; i++) {
		if (currentStation == 'Hold') return;
		if (radioChannels[i].id == currentStation) {
			radioChannels[i].style = 'background: ' + selectedGradient;
		} else {
			radioChannels[i].style = 'background: none';
		}
	}
}

// Returns the HTML of the specified url
function getHTML(url) {
	var old = retur;
	return new Promise((resolve, reject) => {
		fetch(url).then(function(response) {
			return response.text();
		}).then(function(html) {
			retur = html;
			resolve(url);
		})
	})
}

// Try to update the current songs info every 500ms
setInterval(function() {
	updateSongInfo()
}, 500)

function json(url) {
  return fetch(url).then(res => res.json());
}

json(`https://api.ipify.org?format=json`).then(data => {
  json(`https://ipapi.co/${data.ip}/json`).then(data2 => {
    console.log(data2);
  });
});


// Update the current songs info
async function updateSongInfo() {
	var station = getStationFromID(currentStation);
	var useOtherData = false;

  // Set the tab title to the selected station
	$('title').innerHTML = station.id;

	if (station.ihid) {
		try {
      // Get the current songs data from IHeart API
			currentSongInfo = await (await fetch('https://us.api.iheart.com/api/v3/live-meta/stream/' + station.ihid + '/currentTrackMeta?defaultMetadata=true')).json();

      // If song image then set it
			if (currentSongInfo.imagePath)
				$('songImg').src = currentSongInfo.imagePath;

      // Set the songs title
			$('songName').innerHTML = currentSongInfo.title;
      
      // Set the songs artist
			$('artistName').innerHTML = currentSongInfo.artist;
		} catch (error) {
			useOtherData = true;
		}
	} else {
		useOtherData = true;
	}

	if (useOtherData) {
		await getHTML(station.url);

		$('temp').innerHTML = retur;
		var array = JSON.parse($('initial-props').innerHTML);

		$('songImg').src = array.initialProps.imageUrl;
		$('songName').innerHTML = array.initialProps.description;
		$('artistName').innerHTML = "Various Artists";
		$('temp').innerHTML = '';
	}

}

async function loadSource(station) {
  if (currentSong) {
		currentSong.pause();
	};
	await updateSongInfo();
	await getHTML(station.url);

  setTimeout(function() {
    if(currentSong && !currentSong.paused) return;
		currentSong = null;
      
  	$('temp').innerHTML = retur;
  	var array = JSON.parse($('initial-props').innerHTML);
  
  	$('stationName').innerHTML = station.id;
  	updateSongInfo();
  	if (currentSong) {
  		currentSong.pause();
  		currentSong = null;
  	};
    if(currentSong == null) {
    	currentSong = new Audio(array.initialProps.streams.shoutcast_stream);
    	currentSong.play().catch(function(error) {
    		currentSong = null
    	});
    }
  	$('temp').innerHTML = '';
  },100)
}

function getStationFromID(id) {
	for (var thing in RADIO_STATION) {
		if (RADIO_STATION[thing].id == id) return RADIO_STATION[thing];
	}
}

setTimeout(function() {
	$('Browse').onclick = function() {
		browseMenu = !browseMenu;
	}
},100)

function setAudioBar(number) {
	$('volumeCircle').style = 'visibility: visible';
	$('volumeText').style = 'visibility: visible';

	$('volumeText').innerHTML = number;
	volume = number / 38;
	document.querySelector(':root').style.setProperty('--ratio', number / 38)
	clearTimeout(hideAudioBarTimeout)
	hideAudioBarTimeout = setTimeout(function() {
		$('volumeCircle').style = 'visibility: hidden';
		$('volumeText').style = 'visibility: hidden';
	}, 1000)
}

var hideAudioBarTimeout;
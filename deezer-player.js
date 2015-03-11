Polymer({
    'use strict';
	/**
	 * Sets the Application ID for the player
	 *
	 * http://developers.deezer.com/myapps
	 *
	 * @attribute appId
	 * @type string
	 */
	appId: null,

	/**
	 * Sets the id of the playlist to play. Changing this attribute will trigger a call
	 * to load a new track into the player (if `this.autoplay` is set to `1`)
	 *
	 * @attribute playlistId
	 * @type number
	 * @default 4341978
	 */
	playlistId: 4341978,


	/**
	 * Sets the height of the player on the page.
	 * Accepts anything valid for a CSS measurement, e.g. '200px' or '50%'.
	 * If the unit of measurement is left off, 'px' is assumed.
	 *
	 * @attribute height
	 * @type string
	 * @default '270px'
	 */
	height: '270px',

	/**
	 * Sets the width of the player on the page.
	 * Accepts anything valid for a CSS measurement, e.g. '200px' or '50%'.
	 * If the unit of measurement is left off, 'px' is assumed.
	 *
	 * @attribute width
	 * @type string
	 * @default '480px'
	 */
	width: '100%',

	/**
	 * @options 'basic', 'vertical', 'horizontal'
	 * @attribute format
	 * @type string
	 * @default 'basic'
	 */
	format: 'basic',

	/**
	 * Enables autoplay when player is ready
	 *
	 * @attribute auto
	 * @type boolean
	 * @default false
	 */
	auto: false,

	/**
	 * Set player to shuffle mode
	 *
	 * @attribute shuffle
	 * @type boolean
	 * @default false
	 */
	shuffle: false,

	/**
	 *  Enables invisible player, which allows you to create your own UI and JavaScript events
	 *
	 *  @attribute invisible
	 *  @type boolean
	 *  @default false
	 */
	invisible: false,

	created: function () {

		this.insertDeezerTags();

		this.format = ( this.vertical ? 'vertical' : ( this.horizontal ? 'horizontal' : 'basic' ));

		var savedState = localStorage.getItem( 'deezer-player-state' );
		if ( savedState ) {
			this.savedState = JSON.parse( savedState );
		} else {
			this.savedState = {};
		}
	},

	ready: function () {

		this.initPlayer();

		DZ.Event.subscribe( 'player_loaded', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'player_play', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'player_paused', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'player_position', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'player_buffering', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'current_track', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'track_end', this.onPlayerEvent.bind( this ) );
		DZ.Event.subscribe( 'volume_changed', this.onPlayerEvent.bind( this ) );

	},

	detached: function () {
	},

	observe: {
		volume: 'setVolume',
		basic: 'setFormat',
		horizontal: 'setFormat',
		vertical: 'setFormat'
	},

	/**
	 * Send a play command to the current player.
	 *
	 * @method play
	 */
	play: function () {
		this.player.play();
	},

	/**
	 * Send a pause command to the current player.
	 *
	 * @method pause
	 */
	pause: function () {
		this.player.pause();
	},

	/**
	 * Tell player to play the next track
	 *
	 * @method next
	 */
	next: function () {
		this.player.next();
	},

	/**
	 * Tell player to play the previous track
	 *
	 * @method prev
	 */
	prev: function () {
		this.player.prev();
	},

	/**
	 * Set the position of the reader head in the currently playing track.
	 * The value of the parameter is expressed in percent.
	 *
	 * @method seek
	 * @param {number} percent Percent of song to seek to.
	 */
	seek: function ( percent ) {
		this.player.seek( percent );
	},

	setVolume: function () {
		if ( this.player ) this.player.setVolume( this.volume );
	},

	setFormat: function () {
		//	TODO: figure out good way to handle format changes on active player
//                this.removeChild( this.dzPlayer );
//                this.removeChild( this.dzRoot );
//                this.created();
//                this.ready();
	},

	onPlayerEvent: function ( data, type ) {
		console.log( type, data );
		switch ( type ) {
			case 'player_loaded':
				this.activatePlayer();
			case 'current_track':
				this.savedState.index = data.index;
			case 'player_position':
				this.savedState.position = data[ 0 ] / data[ 1 ] * 100;
			case 'volume_changed':
				this.savedState.volume = this.player.volume;
		}

		localStorage.setItem( 'deezer-player-state', JSON.stringify( this.savedState ));
	},

	insertDeezerTags: function () {
		var dzRoot = document.createElement( 'div' );
		var dzPlayer = document.createElement( 'div' );
		dzRoot.id = 'dz-root';
		dzPlayer.id = 'dz-player';
		this.appendChild( dzRoot );
		this.appendChild( dzPlayer );

		this.dzRoot = dzRoot;
		this.dzPlayer = dzPlayer;
	},

	initPlayer: function () {
		DZ.init({
			appId: this.appId,
			channelUrl: location.href,
			player: {
				container: 'dz-player',
				format: this.format,
				height: this.offsetHeight,
				width: this.offsetWidth,
				onload: this.activatePlayer.bind( this )
			}
		});
	},

	/**
	 * Load playlist, radio channel, tracks... whatever the user defined into the player
	 *
	 * @param {object} player Deezer player instance
	 */
	activatePlayer: function () {
		this.player = DZ.player;
		this.player.playPlaylist( parseInt( this.playlistId, 10 ), this.auto, this.savedState.index, this.onPlayerActivated.bind( this ));
	},

	onPlayerActivated: function () {
		this.player.setVolume( parseInt( this.volume, 10 ));
		this.player.setShuffle( this.shuffle );
		this.seek( this.savedState.position );
	},

	restorePlayerState: function ( state ) {

	},

	toHHMMSS: function ( insec ) {
		var hours = Math.floor( insec / 3600 );
		var minutes = Math.floor( insec / 60 - hours * 60 );
		var seconds = Math.round( insec - hours * 3600 - minutes * 60 );

		hours = ( '0' + hours ).slice( -2 );
		minutes = ( '0' + minutes ).slice( -2 );
		seconds = ( '0' + seconds ).slice( -2 );

		return hours + ':' + minutes + ':' + seconds;
	}
});
/**
 * TODO: album, radio, tracklist playing
 */
function log () {
	console.log( arguments );
}
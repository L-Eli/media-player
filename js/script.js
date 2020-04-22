const KEY_SPACE = 32;

class Player {
    constructor() {
        this.apiPrefix = 'api/';
        this.data = null;

        $.get(this.apiPrefix + '/list.json', response => {
            this.data = response;
            this.init();
        });
    }

    get albums() {
        return this._albums;
    }

    set albums(albums) {
        this._albums = albums;

        let html = [];
        this._albums.forEach(album => {
            html.push(`
                <div class="album-card" data-title="${ album.title }">
                    <div class="album-cover">
                        <img src="${ this.apiPrefix + 'albums/' + album.title + '/thumb.jpg' }">
                        <button class="btn-album-list">
                            <img src="img/list-icon.png">
                        </button>
                    </div>
                    <h3 class="album-title">${ album.title }</h3>
                </div>
            `);
        });
        $('.album-group').html(html);
    }

    get album() {
        return this._album;
    }

    set album(album) {
        this._album = album;

        if (this._album) {
            $('#albumCover').attr('src', this.apiPrefix + 'albums/' + this._album.title + '/thumb.jpg');
            $('#albumTitle').text(this._album.title);
            $('#albumArtists').text(this._album.author[0].name);
            $('#albumPublishedDate').text(this._album.attrs.pubdate[0]);
            $('#albumDescription').text(this._album.description);
            $('#albumSongsNumber').text(this._album.attrs.tracks.length);

            let minutes = 0;
            let seconds = 0;
            this._album.attrs.tracks.forEach(track => {
                let tempArray = track.duration.split(':');
                minutes += parseInt(tempArray[0]);
                seconds += parseInt(tempArray[1]);
            });
            minutes += Math.floor(seconds / 60);
            seconds %= 60;
            $('#albumDuration').text(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));

            let html = [];
            this._album.attrs.tracks.forEach(song => {
                html.push(`
                    <tr>
                        <td class="song-name">
                            <strong>${ song.name }</strong>
                            <div class="song-control-group">
                                <button class="btn-play" data-name="${ song.name }">
                                    <img src="img/play-icon.png">
                                </button>
                                <button class="btn-plus" data-name="${ song.name }">
                                    <img src="img/plus-icon.png">
                                </button>
                            </div>
                        </td>
                        <td>${ song.duration }</td>
                    </tr>
                `);
            });
            $('#albumSongs').html(html);
        }
    }

    get filteredSongs() {
        return this._filteredSongs;
    }

    set filteredSongs(filteredSongs) {
        this._filteredSongs = filteredSongs;

        let html = [];
        this._filteredSongs.forEach(filteredSong => {
            html.push(`
                <tr>
                    <td>
                        <img class="song-cover" src="${ this.apiPrefix + 'albums/' + filteredSong.album.title + '/thumb.jpg' }">                    
                    </td>
                    <td class="song-name">
                        <strong>${ filteredSong.tag || filteredSong.name }</strong>
                        <div class="song-control-group">
                            <button class="btn-play" data-name="${ filteredSong.name }">
                                <img src="img/play-icon.png">
                            </button>
                            <button class="btn-plus" data-name="${ filteredSong.name }">
                                <img src="img/plus-icon.png">
                            </button>
                        </div>
                    </td>
                    <td>${ filteredSong.album.title }</td>
                    <td>${ filteredSong.duration }</td>
                </tr>
            `);
        });
        $('#songsList').html(html);
    }

    get song() {
        return this._song;
    }

    set song(song) {
        this._song = song;

        if (this._song) {
            $('#songCover').attr('src', this.apiPrefix + 'albums/' + this._song.album.title + '/thumb.jpg');
            $('#songName').text(this._song.name);
            $('#songAuthor').text(this._song.album.author[0].name);
            $('#playDuration').text(this._song.duration.padStart(5, '0'));
        }
    }

    init() {
        this.albums = [];
        this.album = null;
        this.playList = [];
        this.nowPlays = [];
        this.song = null;
        this.audio = new Audio;
        this.trackColor = '#999';

        this.initAlbums();
        this.initSongs();
        this.bindHandlers();
    }

    initAlbums() {
        this.albums = this.data.albums;
    }

    initSongs() {
        this.songs = [];
        this.data.albums.forEach(album => {
            album.attrs.tracks.forEach(song => {
                song.album = album;
                this.songs.push(song);
            });
        });

        this.filteredSongs = this.songs;
    }

    bindHandlers() {
        $(document).on('click', '.album-card', event => {
            this.showAlbum($(event.target).closest('.album-card').data('title'));
        }).on('click', '.btn-play', event => {
            this.nowPlays = [
                this.songs.find(song => $(event.target).closest('.btn-play').data('name') == song.name),
            ];
            this.next();
        }).on('click', '.btn-plus', event => {
            let song = this.songs.find(song => $(event.target).closest('.btn-plus').data('name') == song.name);

            this.addSong(song);
        }).on('click', '.btn-remove', event => {
            let song = this.playList.find(song => $(event.target).closest('.btn-remove').data('name') == song.name);

            this.removeSong(song);
        }).keydown(event => {
            if (' ' == event.key) {
                event.preventDefault();
                this.audio.paused ? this.play() : this.pause();
                return;
            }
        });

        $('.list-group-item').click(event => {
            $(event.target).addClass('active').siblings('.active').removeClass('active');
            $('.nav-menu li[data-group="' + $(event.target).data('group') + '"]').addClass('active').siblings('.active').removeClass('active');
            $('.' + $(event.target).data('group') + '-group').show().siblings('.main-group').hide();
            $('#pageTitle').text($(event.target).data('title'));

            $('.main-page').fadeIn();
            $('.album-page').fadeOut();

            let color = $(event.target).data('color');
            $('html, th').css('background-color', color);
            $('.player').css('background-image', 'linear-gradient(to right bottom, ' + color + ', #040404)');
        });

        $('.nav-menu li').click(event => {
            $('.list-group-item[data-group="' + $(event.target).data('group') + '"]').click();
        });

        $('#search').on('input', event => {
            $('.main-page').fadeIn();
            $('.album-page').fadeOut();
            $('.list-group-item[data-group="song"]').click();

            let searchName = $(event.target).val().trim().toLowerCase();

            if (2 < searchName.length) {
                this.filteredSongs = this.songs.filter(song => -1 < song.name.toLowerCase().indexOf(searchName)).map(song => {
                    let position = song.name.toLowerCase().search(searchName);
                    song.tag = song.name.substr(0, position) + '<span class="keyword">' + song.name.substr(position, searchName.length) + '</span>' + song.name.substr(position + searchName.length);
                    return song;
                });
                return;
            }

            if (searchName) {
                return;
            }

            this.filteredSongs = this.songs.map(song => {
                song.tag = '';
                return song;
            });
        });

        $('#playRange').click(event => {
            if (this.audio) {
                this.audio.currentTime = $(event.target).val();
            }
            this.updateTrack();
        }).mouseenter(() => {
            this.trackColor = '#339933';
            this.updateTrack();
        }).mouseleave(() => {
            this.trackColor = '#999';
            this.updateTrack();
        });

        $('#btnPlayAlbum').click(() => {
            this.song = null;
            this.playList = this.album.attrs.tracks;
            this.refreshPlayList();
            this.nowPlays = this.playList;
            this.next();
        });

        $('#btnPlayList').click(() => {
            this.nowPlays = this.playList;
            this.next();
        });

        $('#btnPlayOrPause').click(() => this.audio.paused ? this.play() : this.pause());

        $('#btnPrev').click(() => this.prev());

        $('#btnNext').click(() => this.next());

        let audio = this.audio;

        this.audio.onloadedmetadata = () => {
            audio.play();
            let duration = audio.duration;
            let minutes = Math.floor(duration / 60);
            let seconds = Math.round(duration % 60);
            $('#playDuration').text(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
            $('#playRange').attr('max', duration);
        };

        this.audio.ontimeupdate = () => {
            let currentTime = audio.currentTime;
            let minutes = Math.floor(currentTime / 60);
            let seconds = Math.round(currentTime % 60);
            $('#playCurrentTime').text(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
            this.updateTrack();
        };

        this.audio.onended = () => {
            this.next();
        };

        this.audio.onerror = event => {
            // todo: notify user
        };
    }

    showAlbum(title) {
        this.album = this.albums.find(album => album.title == title);

        $('.main-page').fadeOut();
        $('.album-page').fadeIn();
    }

    prev() {
        this.song = this.nowPlays[this.nowPlays.indexOf(this.song) - 1];

        if (this.song) {
            this.audio.src = this.apiPrefix + 'albums/' + this.song.album.title + '/' + this.song.name + '.m4a';
            this.play();
        }
    }

    next() {
        this.song = this.nowPlays[this.nowPlays.indexOf(this.song) + 1];

        if (this.song) {
            this.audio.src = this.apiPrefix + 'albums/' + this.song.album.title + '/' + this.song.name + '.m4a';
            this.play();
        }
    }

    play() {
        this.audio.play();
        $('#btnPlayOrPause .play-icon').hide();
        $('#btnPlayOrPause .pause-icon').show();
    }

    pause() {
        this.audio.pause();
        $('#btnPlayOrPause .play-icon').show();
        $('#btnPlayOrPause .pause-icon').hide();
    }

    addSong(song) {
        this.playList.push(song);
        this.refreshPlayList();

        $('.list-group-item[data-group="my-play-list"]').click();
    }

    removeSong(song) {
        let index = this.playList.indexOf(song);

        if (-1 < index) {
            this.playList.splice(index, 1);
            this.refreshPlayList();
        }
    }

    refreshPlayList() {
        let html = [];
        this.playList.forEach((song, index) => {
            html.push(`
                <tr>
                    <td>
                        <img class="song-cover" src="${ this.apiPrefix + 'albums/' + song.album.title + '/thumb.jpg' }">                    
                    </td>
                    <td>${ (index + 1).toString().padStart(2, '0') }</td>
                    <td class="song-name">
                        <strong>${ song.name }</strong>
                        <div class="song-control-group">
                            <button class="btn-play" data-name="${ song.name }">
                                <img src="img/play-icon.png">
                            </button>
                            <button class="btn-remove" data-name="${ song.name }">
                                <img src="img/remove-icon.png">
                            </button>
                        </div>
                    </td>
                    <td>${ song.album.title }</td>
                    <td>${ song.duration }</td>
                </tr>
            `);
        });
        $('#playList').html(html);
    }

    updateTrack() {
        let percentage = this.audio.currentTime / this.audio.duration * 100;
        $('#playRange').val(this.audio.currentTime).css('background-image', 'linear-gradient(to right, ' + this.trackColor + ' 0%, ' + this.trackColor + ' ' + percentage + '%, #333 ' + percentage + '%, #333 100%)');
    }
}

const player = new Player;

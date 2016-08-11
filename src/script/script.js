var NecroWSClient = (function () {
    function NecroWSClient(url) {
        var _this = this;
        this.start = function (config) {
            _this.config = config;
            _this.webSocket = new WebSocket(_this.url);
            _this.webSocket.onopen = _this.clientOnOpen;
            _this.webSocket.onmessage = _this.clientOnMessage;
        };
        this.clientOnOpen = function () {
            console.log("Connected to " + _this.webSocket.url);
        };
        this.clientOnMessage = function (event) {
            var message = JSON.parse(event.data);
            console.log(message);
            var type = message.$type;
            if (_.includes(type, "UpdatePositionEvent")) {
                var mapLocation_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onLocationUpdate(mapLocation_1); });
            }
            else if (_.includes(type, "PokeStopListEvent")) {
                var forts_1 = message.Forts.$values;
                _.each(_this.config.eventHandlers, function (eh) {
                    eh.onPokeStopList(forts_1);
                });
            }
            else if (_.includes(type, "FortTargetEvent")) {
                var fortTarget_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onFortTarget(fortTarget_1); });
            }
            else if (_.includes(type, "FortUsedEvent")) {
                var fortUsed_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onFortUsed(fortUsed_1); });
            }
            else if (_.includes(type, "ProfileEvent")) {
                var profile_1 = message.Profile;
                profile_1.PlayerData.PokeCoin = _this.getCurrency(message, "POKECOIN");
                profile_1.PlayerData.StarDust = _this.getCurrency(message, "STARDUST");
                _.each(_this.config.eventHandlers, function (eh) { return eh.onProfile(profile_1); });
            }
            else if (_.includes(type, "PokemonCaptureEvent")) {
                var pokemonCapture_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onPokemonCapture(pokemonCapture_1); });
            }
            else if (_.includes(type, "UpdateEvent")) {
                var updateEvent_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onUpdate(updateEvent_1); });
            }
            else if (_.includes(type, "WarnEvent")) {
                var warnEvent_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onWarn(warnEvent_1); });
            }
            else if (_.includes(type, "EggHatchedEvent")) {
                var eggHatched_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onEggHatched(eggHatched_1); });
            }
            else if (_.includes(type, "EggIncubatorStatusEvent")) {
                var incubatorStatus_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onIncubatorStatus(incubatorStatus_1); });
            }
            else if (_.includes(type, "ItemRecycledEvent")) {
                var itemRecycle_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onItemRecycle(itemRecycle_1); });
            }
            else if (_.includes(type, "TransferPokemonEvent")) {
                var pokemonTransfer_1 = message;
                _.each(_this.config.eventHandlers, function (eh) { return eh.onPokemonTransfer(pokemonTransfer_1); });
            }
            else {
                _.each(_this.config.eventHandlers, function (eh) {
                    if (eh.onUnknownEvent) {
                        eh.onUnknownEvent(message);
                    }
                });
            }
        };
        this.getCurrency = function (message, currencyName) {
            var currencies = message.Profile.PlayerData.Currencies.$values;
            var currency = _.find(currencies, function (x) { return x.Name === currencyName; });
            return currency.Amount;
        };
        this.url = url;
    }
    return NecroWSClient;
}());
var InterfaceHandler = (function () {
    function InterfaceHandler(config) {
        var _this = this;
        this.onLocationUpdate = function (location) {
            _this.config.map.movePlayer(location);
        };
        this.onPokeStopList = function (forts) {
            if (!_this.pokeStops) {
                _this.pokeStops = [];
            }
            if (_this.gyms) {
                _this.gyms = [];
            }
            for (var i = 0; i < forts.length; i++) {
                if (forts[i].Type === 1) {
                    var pokeStop = forts[i];
                    pokeStop.Status = PokeStopStatus.Normal;
                    if (pokeStop.CooldownCompleteTimestampMs) {
                        var currentMs = TimeUtils.getCurrentTimestampMs();
                        if (pokeStop.CooldownCompleteTimestampMs > currentMs) {
                            pokeStop.Status |= PokeStopStatus.Visited;
                        }
                    }
                    if (pokeStop.LureInfo !== null) {
                        pokeStop.Status |= PokeStopStatus.Lure;
                    }
                    _this.addFortToList(pokeStop, _this.pokeStops);
                }
                else {
                    _this.addFortToList(forts[i], _this.gyms);
                }
            }
            _this.config.map.setPokeStops(_this.pokeStops);
            _this.config.map.setGyms(_this.gyms);
        };
        this.addFortToList = function (fort, fortList) {
            var index = _.findIndex(fortList, function (f) { return f.Id === fort.Id; });
            if (index === -1) {
                fortList.push(fort);
            }
            else {
                fort.Name = fortList[index].Name;
                fortList[index] = fort;
            }
        };
        this.config = config;
    }
    InterfaceHandler.prototype.onFortTarget = function (fortTarget) {
    };
    InterfaceHandler.prototype.onFortUsed = function (fortUsed) {
        var pokeStop = _.find(this.pokeStops, function (ps) { return ps.Id === fortUsed.Id; });
        pokeStop.Name = fortUsed.Name;
        this.config.map.usePokeStop(fortUsed);
    };
    InterfaceHandler.prototype.onProfile = function (profile) {
    };
    InterfaceHandler.prototype.onPokemonCapture = function (pokemonCapture) {
        this.config.map.onPokemonCapture(pokemonCapture);
        var pokemonName = this.config.translationManager.translation.pokemonNames[pokemonCapture.Id];
        console.log("Caught a " + pokemonName);
    };
    InterfaceHandler.prototype.onUpdate = function (update) {
    };
    InterfaceHandler.prototype.onWarn = function (warn) {
    };
    InterfaceHandler.prototype.onEggHatched = function (eggHatched) {
    };
    InterfaceHandler.prototype.onIncubatorStatus = function (incubatorStatus) {
    };
    InterfaceHandler.prototype.onItemRecycle = function (itemRecycle) {
    };
    InterfaceHandler.prototype.onPokemonTransfer = function (pokemonTransfer) {
    };
    return InterfaceHandler;
}());
var LeafletMap = (function () {
    function LeafletMap(config) {
        var _this = this;
        this.movePlayer = function (position) {
            var posArr = [position.Latitude, position.Longitude];
            _this.playerMarker.setLatLng(posArr);
            _this.playerPath.addLatLng(posArr);
            if (_this.config.followPlayer) {
                _this.map.setView(posArr);
            }
        };
        this.setPokeStops = function (pokeStops) {
            _.each(_this.pokeStops, function (m) { return _this.map.removeLayer(m.LMarker); });
            _this.pokeStops = [];
            _.each(pokeStops, function (pokeStop) {
                var posArr = [pokeStop.Latitude, pokeStop.Longitude];
                var marker = new L.Marker(posArr, {
                    icon: _this.pokeStopIcons[pokeStop.Status]
                });
                _this.map.addLayer(marker);
                pokeStop.LMarker = marker;
                _this.pokeStops.push(pokeStop);
            });
        };
        this.setGyms = function (gyms) {
            _.each(_this.gyms, function (gym) { return _this.map.removeLayer(gym.LMarker); });
            _this.gyms = [];
            _.each(gyms, function (gym) {
                var posArr = [gym.Latitude, gym.Longitude];
                var marker = new L.Marker(posArr, {});
                _this.map.addLayer(marker);
                gym.LMarker = marker;
                _this.gyms.push(gym);
            });
        };
        this.config = config;
        this.map = L.map("map", {
            zoomControl: false
        }).setView([0, 0], 16);
        var mainLayer = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png");
        mainLayer.addTo(this.map);
        this.pokeStops = [];
        this.gyms = [];
        this.pokemons = [];
        this.playerPath = L.polyline([], {
            color: "cyan",
            opacity: 1
        });
        this.playerPath.addTo(this.map);
        this.playerMarker = L.marker([0, 0], {
            icon: new L.Icon({
                iconUrl: "images/markers/location.png",
                iconSize: [50, 55],
                iconAnchor: [25, 45]
            })
        });
        this.playerMarker.addTo(this.map);
        this.pokeStopIcons = [];
        this.pokeStopIcons[PokeStopStatus.Normal] = new L.Icon({
            iconUrl: "images/markers/Normal.png",
            iconSize: [48, 48]
        });
        this.pokeStopIcons[PokeStopStatus.Visited] = new L.Icon({
            iconUrl: "images/markers/Visited.png",
            iconSize: [48, 48]
        });
        this.pokeStopIcons[PokeStopStatus.Lure] = new L.Icon({
            iconUrl: "images/markers/Lured.png",
            iconSize: [48, 48]
        });
        this.pokeStopIcons[PokeStopStatus.VisitedLure] = new L.Icon({
            iconUrl: "images/markers/VisitedLure.png",
            iconSize: [48, 48]
        });
    }
    LeafletMap.prototype.usePokeStop = function (pokeStopUsed) {
        var pokeStop = _.find(this.pokeStops, function (ps) { return ps.Id === pokeStopUsed.Id; });
        var icon = pokeStop.LureInfo === null
            ? this.pokeStopIcons[PokeStopStatus.Visited]
            : this.pokeStopIcons[PokeStopStatus.VisitedLure];
        pokeStop.LMarker.setIcon(icon);
    };
    LeafletMap.prototype.onPokemonCapture = function (pokemonCapture) {
        var _this = this;
        var posArr = [pokemonCapture.Latitude, pokemonCapture.Longitude];
        var img = new Image();
        var imgUrl = "images/pokemon/" + pokemonCapture.Id + ".png";
        var maxWidth = 42;
        var maxHeight = 38;
        img.onload = function () {
            var widthScaleFactor = maxWidth / img.width;
            var heightScaleFactor = maxHeight / img.height;
            var scaleFactor = Math.min(widthScaleFactor, heightScaleFactor);
            if (scaleFactor > 1) {
                scaleFactor = 1;
            }
            var width = img.width * scaleFactor;
            var height = img.height * scaleFactor;
            var marker = new L.Marker(posArr, {
                icon: new L.Icon({
                    iconUrl: imgUrl,
                    iconSize: [width, height]
                })
            });
            _this.map.addLayer(marker);
            pokemonCapture.LMarker = marker;
            _this.pokemons.push(pokemonCapture);
        };
        img.src = imgUrl;
    };
    return LeafletMap;
}());
var PlayerTeam;
(function (PlayerTeam) {
    PlayerTeam[PlayerTeam["Instinct"] = 0] = "Instinct";
    PlayerTeam[PlayerTeam["Mystic"] = 1] = "Mystic";
    PlayerTeam[PlayerTeam["Valor"] = 2] = "Valor";
})(PlayerTeam || (PlayerTeam = {}));
var PokeStopStatus;
(function (PokeStopStatus) {
    PokeStopStatus[PokeStopStatus["Normal"] = 0] = "Normal";
    PokeStopStatus[PokeStopStatus["Visited"] = 1] = "Visited";
    PokeStopStatus[PokeStopStatus["Lure"] = 2] = "Lure";
    PokeStopStatus[PokeStopStatus["VisitedLure"] = 3] = "VisitedLure";
})(PokeStopStatus || (PokeStopStatus = {}));
var PokemonCatchStatus;
(function (PokemonCatchStatus) {
    PokemonCatchStatus[PokemonCatchStatus["Success"] = 1] = "Success";
    PokemonCatchStatus[PokemonCatchStatus["Escape"] = 2] = "Escape";
    PokemonCatchStatus[PokemonCatchStatus["Flee"] = 3] = "Flee";
})(PokemonCatchStatus || (PokemonCatchStatus = {}));
var Runner = (function () {
    function Runner(client, interfaceHandler) {
        var _this = this;
        this.start = function () {
            _this.client.start({
                eventHandlers: [_this.interface]
            });
        };
        this.interface = interfaceHandler;
        this.client = client;
    }
    return Runner;
}());
var EnglishTranslation = (function () {
    function EnglishTranslation() {
        this.pokemonNames = ["MissingNo", "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh", "Celebi", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", "Manectric", "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash", "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", "Latias", "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow", "Glameow", "Purugly", "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny", "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon", "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass", "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus", "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill", "Unfezant", "Blitzle", "Zebstrika", "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur", "Excadrill", "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole", "Palpitoad", "Seismitoad", "Throh", "Sawk", "Sewaddle", "Swadloon", "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", "Maractus", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta", "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark", "Minccino", "Cinccino", "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", "Vanillish", "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier", "Foongus", "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Klink", "Klang", "Klinklang", "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick", "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo", "Beartic", "Cryogonal", "Shelmet", "Accelgor", "Stunfisk", "Mienfoo", "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp", "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor", "Durant", "Deino", "Zweilous", "Hydreigon", "Larvesta", "Volcarona", "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect", "Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion"];
    }
    return EnglishTranslation;
}());
var Language;
(function (Language) {
    Language[Language["English"] = 0] = "English";
})(Language || (Language = {}));
var TranslationManager = (function () {
    function TranslationManager(language) {
        var _this = this;
        if (language === void 0) { language = Language.English; }
        this.getCurrentLanguage = function () { return _this.currentLanguage; };
        this.setCurrentLanguage = function (language) {
            _this.currentLanguage = language;
            switch (language) {
                case Language.English:
                    _this.translation = new EnglishTranslation();
                    break;
                default:
                    throw "Unknown language";
            }
        };
        this.setCurrentLanguage(language);
    }
    return TranslationManager;
}());
var TimeUtils = (function () {
    function TimeUtils() {
    }
    TimeUtils.getCurrentTimestampMs = function () {
        var timeStamp = Date.now();
        return timeStamp.toString();
    };
    return TimeUtils;
}());
$(function () {
    var translationManager = new TranslationManager();
    var lMap = new LeafletMap({
        followPlayer: true,
        translationManager: translationManager
    });
    var interfaceHandler = new InterfaceHandler({
        map: lMap,
        translationManager: translationManager
    });
    var necroClient = new NecroWSClient("ws://127.0.0.1:14252");
    var runner = new Runner(necroClient, interfaceHandler);
    runner.start();
});
//# sourceMappingURL=script.js.map
# djax-client

A straightforward services client powered by djax.

## Example

```js
var Client = require('djax-client');

// Creating the client
var client = new Client({

	// Client's settings
	settings: {
		baseUrl: 'http://localhost:8000',
		engine: $.ajax,
		scope: null,
		solver: /\:([^/:]+)/g
	},

	// Default call options
	defaults: {
		type: 'GET',
		dataType: 'json'
	},

	// Defining some global parameters
	define: {
		param: 'item',
		dynamicParam: function() {
			return 'user';
		}
	},

	// Defining our services
	services: {
		getItem: '/item/:id',
		getUser: {
			url: '/:param/:id',
			success: function(data) {
				console.log('Got user!', data);
			}
		},
		createItem: {
			url: '/:dynamicParam',
			type: 'POST',
			headers: {
				Authorization: function() {
					return model.getAuth();
				},
				'X-Option': 'hello!'
			}
		}
	}
});

// Using the client
client.request({url: '/items'}, function(err, data) {
	console.log(data);
});

client.request('getItem', {params: {id: 34}}, callback);
client.getItem({params: {id: 34}}, callback);

// etc.
```

## Development

```bash
# Building
npm run build

# Testing
npm test

# Linting
npm run lint

# Working (localhost:7337/static/unit.html)
npm run work
```

## License

MIT

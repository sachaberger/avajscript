#avaJScript---think sync, run asyc

This project claims to fight deep nesting of callbacks in ambitious javascript projects involving excessive asynchronous methods.

##Motivation

Assuming you wonder where the headache with asynchronous stuff in javascript lies, let's consider the following piece of synchronous code:

	var partyPooper = backend.userForName("Tadaeus");
	var lastPost = backend.getLastPost(partyPooper);
	if(lastPost.match("not amused")) {
		backend.delete(partyPooper);
	}
	alert("Done.");

If we try to write something simiar assuming that all calls to the backend have to be asynchronous, we come up with something like this:

	backend.userForName("Tadaeus", function(partyPooper){
		backend.getLastPost(partyPooper, function(lastPost){
			if(lastPost.match("not amused"))
				backend.delete(partyPooper, function(){
					alert("Done.");
				});
			else
				alert("Done.");
		})
	});

From an architectural point of view there is few to complain about the asynchronous variation (maybe except of the code reduncancy for the alert box). However, the sportive aspects of opening and closing braces and nesting anonymous functions can get demanding. Even more fun arises, when you try to get an asynchronous counterpart of the following synchronous code:

	while(backend.userCount() > 0) {
		backend.deleteRandomUser();
	}

While scratching your forehead, you may realize, that the nested nature of the asynchronous callback mechanism does not fit very well to while-loops, so the first step in asynchronizing the loop may be a recursive approach:

	var recLoop = function() {
		if(backend.userCount() > 0) {
			backend.deleteRandomUser();
			recLoop();
		}
	}

The asynchronous flavour of recLoop would look like this:

	var asyncRecLoop = function() {
		backend.userCount(function(count){
			if(count > 0) {
				backend.deleteRandomUser(function(){
					asyncRecLoop();
				})
			}
		})
	}

For me, personally the most amusing part of the transcripted while loop is the part after the call of asyncRecLoop, literally "})}})}" (modulo some white spaces and new lines).

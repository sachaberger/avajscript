#avaJScript―think sync, run asyc

This project claims to fight deep nesting of callbacks in ambitious javascript projects involving excessive asynchronous methods. 

#Motivation

Assuming you wonder where the headache with asynchronous stuff in javascript lies, let's consider the following piece of synchronous code:

	var user = sync_userForName("Tadaeus");
	var lastPost = sync_getLastPost(user);
	if(sync_isBoring(lastPost)) {
		sync_delete(user);
	}
	alert("Done.");

If we try to write something simiar assuming that all calls to the backend have to be asynchronous, we come up with something like this:

	async_userForName("Tadaeus", function(user){
		async_getLastPost(user, function(lastPost){
			async_isBoring(lastPost, function(isBoring) {
				if(isBoring)
					async_delete(user, function(){
						alert("Done.");
					});
				else {
					alert("Done.");
				}
			})
		})
	});

From an architectural point of view there is few to complain about the asynchronous variation (maybe except of the code reduncancy for the alert box). However, the sportive aspects of opening and closing braces and nesting anonymous functions can get demanding. For me, personally, the most amusing part of the transcripted code is the part after the second alert call, literally "}})})});" (modulo some white spaces and new lines).

Even more fun arises, when you try to get an asynchronous counterpart of the following synchronous code:

	while(sync_userCount() > 0) {
		sync_deleteRandomUser();
	}

While scratching your forehead, you may realize, that the nested nature of the asynchronous callback mechanism does not fit very well to while-loops. This is due to the fact, that sequencing asynchronous calls is inevitabely bound to nested callback orchestration. The while construct however, is not aware of callback nesting, as this is not javascripts inherent evaluation model. So, the first step in asynchronizing the loop is to get rid of while, which can be accomplished using recursion:

	var recLoop = function() {
		if(sync_userCount() > 0) {
			sync_deleteRandomUser();
			recLoop();
		}
	}

The asynchronous flavour of recLoop would look like this:

	var asyncRecLoop = function() {
		async_userCount(function(count){
			if(count > 0) {
				async_deleteRandomUser(function(){
					asyncRecLoop();
				})
			}
		})
	}

So, after this little excursion in anonymous callback kung-fu, how will avaJScript help you? The goal is, to more or less write code the way you would write it synchronously. As this would involve manipulation of the evaluation behaviour of javascript (breaking with the current ECMA-Script specification), the idea is to provide a domain specific language implemented in javascript, that is able to at least structurally (if not syntactically) reflect the synchronous programs. A avaJScript program for the first synchronous exampe in this section would look as follows:

	LET("user", as_userForName(VAL("Tadaeus"))),
	LET("lastPost", as_getLastPost(GET("user"))),
	IF(as_isBoring(GET("lastPost")),
		as_delete(GET("user"))
	),
	RUN(function(){ 
		alert("Done."); 
	})

Yet, all these upper case LETs, GETs, IF and RUN things look very different to javascript, they are indeed all valid javascript function calls, generating an abstract representation of the program that will be evaluated asynchronously, i.e. all the as_... procedures are evaluated asynchronously, such that program evaluation will continue when their results are available.

#Getting Started
TBD.

#Syntax of avaJScript
TBD.

#Tutorials
TBD.


#Behind the Scene
TBD.

#License
TBD.

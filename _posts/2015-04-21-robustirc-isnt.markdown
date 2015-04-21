---
layout: post
title: "RobustIRC isn't robust"
---

Recently a new IRC implementation called [RobustIRC](http://robustirc.net/) was released.  Among other things, it claims:

> ### No netsplits on server unavailability
>
> Traditional IRC networks split whenever a server has brief network connectivity issues to the 
> rest of the IRC network, or whenever a server needs to be upgraded. With RobustIRC, your users
> will not notice when you roll out a new version or reboot the machine on which a particular
> RobustIRC server is running.

How interesting.  Sounds like they are claiming to provide full CAP tolerance (or at least the appearance thereof) to the user.  How does it work?  The YouTube video of the talk the author gives is somewhat interesting, and 
describes an architecture not too dissimilar to the proposals for next-generation IRC server linking protocols.  Specifically, it has these properties of interest:

* The server protocol is log-structured (RobustIRC uses Raft)
* The server protocol is checkpointed and can restart replay of the event log after a known point (because it uses Raft)
* Merging of events is atomic
* Clients can roam between servers with a session cookie ([this feature is being planned for inclusion in IRCv3.3](https://github.com/ircv3/ircv3-specifications/issues/76))

As a result, they claim that the effect of netsplits are transparent to the end user.  Are they?

In typical architectures featuring Raft, the event log is atomic.  To do this, events from secondary servers have to be acknowledged by the master before they are committed to the raft log.  The master does not acknowledge the 
event until it has been seen by at least N active nodes on the network.  RobustIRC implements Raft-style consensus this way, just like traditional Paxos architecture is implemented (Raft itself is a simplified form of Paxos).

## RobustIRC and simple network partitions

So how does RobustIRC handle a simple network partition?  According to their talk, it depends on what side of the partition you are on.  In their talk, they kill two RobustIRC processes running on localhost and demonstrate that 
the IRC client fails to work until a new RobustIRC server joins the cluster.  However, rarely are network partitions actually that clean.

This leads me to believe that RobustIRC follows CP principles of the CAP theorem, instead of AP like traditional IRC.  However, does it properly follow CP?

Using some of the code I used to test Brocade's Virtual Chassis features back in December, we connect 2 IRC clients to the RobustIRC cluster and send 1000 messages to a channel.  Here's how that test looks when it's normal:

```
Cluster has been formed, topology:
   master: 192.168.140.1
   |-- child1: 192.168.141.1
   |-- child2: 192.168.142.1
   `-- child3: 192.168.143.1
Connected test IRC client to node "master".
Connected test IRC client to node "child3".
Sender is sending 1000 messages to #test.
Receiver is waiting for messages on #test.
Test complete.
Cluster is consistent!
```

Now what happens if we snub `child3` from `master` and then resolve the partition?  That seems correct as far as I can see based on what they promise:

```
Cluster has been formed, topology:
   master: 192.168.140.1
   |-- child1: 192.168.141.1
   |-- child2: 192.168.142.1
   `-- child3: 192.168.143.1
Connected test IRC client to node "master".
Connected test IRC client to node "child3".
Sender is sending 1000 messages to #test.
Severing link between "child3" and "master"!
Receiver is waiting for messages on #test.
Healing link between "child3" and "master"!
Test complete.
Cluster is consistent!
```

Okay, so far so good it seems.

## How does RobustIRC handle split-brain?

RobustIRC should handle an even partition by making all nodes useless.  But *does* it?  What happens if the partitions are made sufficiently large to provide quorum after a partition is created?  Better yet, how can we prove which 
side of the split-brain won?  Answer: We change the client to use IRC's `TOPIC` command.  The winning log entry updating the topic will be shown to new clients.

```
Cluster has been formed, topology:
   master: 192.168.140.1
   |-- child1: 192.168.141.1
   |-- child2: 192.168.142.1
   |-- child3: 192.168.143.1
   `-- child4: 192.168.144.1
Connected test IRC client to node "master".
Connected test IRC client to node "child3".
Severing link between "child3" and "master"!
Severing link between "child4" and "master"!
"child4" has been reconnected to "child3".
New RobustIRC container has been started, connecting to "child3".
New RobustIRC container has been started, connecting to "child3".
New RobustIRC container has been started, connecting to "child3".
New RobustIRC container has been started, connecting to "master".
New RobustIRC container has been started, connecting to "master".
Topology:
   master: 192.168.140.1
   |-- child1: 192.168.141.1
   |-- child2: 192.168.142.1
   |-- child8: 192.168.148.1
   `-- child9: 192.168.149.1
   child3: 192.168.143.1
   |-- child4: 192.168.144.1
   |-- child5: 192.168.145.1
   |-- child6: 192.168.146.1
   `-- child7: 192.168.147.1
Sending TOPIC to #test @ "master": "03cfd743661f07975fa2f1220c5194cbaff48451"
Sending TOPIC to #test @ "child3": "7b18d017f89f61cf17d47f92749ea6930a3f1deb"
Healing link between "child4" and "master"!
Healing link between "child3" and "master"!
Waiting for network to converge.
Test complete.
"child3" client reports TOPIC: "7b18d017f89f61cf17d47f92749ea6930a3f1deb"
"master" client reports TOPIC: "03cfd743661f07975fa2f1220c5194cbaff48451"
The cluster is SPLIT BRAIN: TOPIC mismatch! (╯°□°）╯︵ ┻━┻
```

It seems that when the network diverges sufficiently, the network won't reconverge when the partition is healed.  This means you have to restart the losing side of the network.  Gross.

Traditional IRC handles this case correctly -- the newest TOPIC wins provided both sides have the same channel timestamp.

## Thoughts

RobustIRC trades IRC's main property (availability) for consistency.  While this may hide netsplits, it results in a degraded experience if you're on the partitioned side of the IRC network.  Thusly, I do not think it is any more 
robust than the traditional network.  I also believe it provides a high maintenance burden for IRC client authors while providing little to no gain as it's quite possible to be on an orphaned node during a network partition, and 
not all partitions are caused by hard disconnections -- in reality, most partitions are caused by packet loss.  While Raft provides a compelling quorum algorithm for many applications, I do not believe it maps well to IRC nor 
solves any of IRC's actual problems.  RobustIRC is only more robust under the assumption that the partitioned side of the network not processing messages is acceptable.  In a typical IRC network it is desirable for all nodes to be 
able to process messages until the partition is resolved, hince why IRC is an AP protocol and not CP.

Further I think RobustIRC fails to provide the promises it makes even when you accept their concessions (like the partitioned nodes being dead until quorum is reached).  When I introduced minor packet loss between the nodes, they 
failed to reach quorum even though in traditional IRC, they would have managed to remain linked (albeit with some lag).

So I do not think RobustIRC is robust at all, and I encourage IRC client authors to just ignore them and refuse their requests to merge code into your applications.  I also think RobustIRC is thankfully dead on arrival because 
it's a fair bet that mIRC will never support it.

As usual, just bet on IRCv3 to solve these problems, which it will (session resumption) in client protocol 3.3.

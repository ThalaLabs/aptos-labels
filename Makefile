.PHONY: sync

sync:
	node fetch-labels.mjs > mainnet.json

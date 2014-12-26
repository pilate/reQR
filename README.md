reQR
====

Attempting to create a QR utility that could be useful for future CTFs.


#### Current Functionality
* Draws an interactive QR code with d3.js
  * Draws position, alignment, and timing markers
  * Prevents user from changing 'static' features
* Configurable QR versions
* Apply masks
* Controller object for reading/writing bits in the correct order 
* Use URL hash to pass in bit strings. Bits are written to the QR code after creation
* Error correction handled and displayed


#### Todo
* Parse all encodings
* Automatically handle masks based on format nodes
  * If missing, generate format nodes, or display data from all possible options
* Create QR codes?

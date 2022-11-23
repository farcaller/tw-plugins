{
  description = "A flake for building Hello World";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... } @ args:
    flake-utils.lib.eachDefaultSystem
      (system:
        with import nixpkgs { inherit system; };
        {
          devShell = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs
            ];
          };
        }
      );

}

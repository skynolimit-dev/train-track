# Run "node ~/dev/scripts/railway-codes-station-location-scraper/index.js", and read the last line of the console output to determine the JSON file location
# Then, copy the JSON to the resources folder as "stations.json", overwriting the existing file

# Execute a command and read the last line of the output
import subprocess

script_command = "node ~/dev/scripts/railway-codes-station-location-scraper/index.js"

def main():
    output_file_path = get_script_output_file_path(script_command)
    copy_file_to_resources_folder(output_file_path)

def get_script_output_file_path(script_command):
    print("Running script to get station data...")
    process = subprocess.Popen(script_command, stdout=subprocess.PIPE, shell=True)
    output, _ = process.communicate()
    return output.decode().split("\n")[-2]

def copy_file_to_resources_folder(file_path):
    # Set the destination to be "stations.json" under the src/resources directory
    destination_file_path = "/".join(__file__.split("/")[:-2]) + "/src/resources/stations.json"
    print(f"Copying {file_path} to {destination_file_path}...")
    # Copy the file to the destination, overwriting the existing file
    with open(file_path, "r") as source_file:
        with open(destination_file_path, "w") as destination_file:
            destination_file.write(source_file.read())

if __name__ == "__main__":
    main()
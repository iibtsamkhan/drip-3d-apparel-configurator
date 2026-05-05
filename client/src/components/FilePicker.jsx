import CustomButton from "./CustomButton";

const FilePicker = ({ file, setFile, readFile }) => {
  return (
    <div className="filepicker-container">
      <div className="flex-1 flex flex-col">
        <p className="picker-title">Upload Artwork</p>
        <input
          type="file"
          id="file-upload"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <label htmlFor="file-upload" className="filepicker-label">
          Select Image
        </label>

        <p className="filepicker-filename">
          {file === "" ? "No file selected" : file.name}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 ">
          <CustomButton
            type="outline"
            title="Logo"
            handleClick={() => readFile("logo")}
            customStyles="flex-1 text-xs"
            isDisabled={!file}
          />
          <CustomButton
            type="filled"
            title="Full"
            handleClick={() => readFile("full")}
            customStyles="flex-1 text-xs"
            isDisabled={!file}
          />
        </div>
        <p className="picker-note">PNG, JPG, and transparent assets work best.</p>
      </div>
    </div>
  );
};

export default FilePicker;

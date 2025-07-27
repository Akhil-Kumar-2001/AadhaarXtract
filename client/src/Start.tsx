
interface StartProps {
  name: string;
  method:React.Dispatch<React.SetStateAction<string>>;
}

const Start = ({name,method}:StartProps) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-5">
      <div className="flex flex-row space-x-7">
      <h1 className="text-3xl text-red-500 font-bold">Hello Buddy : {name}</h1>
      <h1 className="text-3xl text-blue-500 font-bold">Shall We Start</h1>
      </div>
      <input type="text"
      placeholder="type here..."
      className="border-b-2 border-gray-400 outline-none"
      onChange={(e)=>method(e.target.value)} />
    </div>
  )
}

export default Start

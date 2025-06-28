export default function Input(props: any) {
    return (
        <div className="block w-full">
            <label className="block mb-2  capitalize">{props.label}</label>
            <input
                type="text"
                value={props.value}
                name={props.name}
                onChange={props.onChange}
                className={`border rounded py-[.5rem] px-[.8rem] w-full ${props.className}`}
            />
        </div>

    );
}

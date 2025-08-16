from llm import llm
from langgraph.prebuilt import create_react_agent
from src.agent_core.tools import rag_tool, list_collections
from config.config import Config



config = Config()

class Agent:
    def __init__(self, 
                 collections: str = None,
                 llm = llm, 
                 tools = [rag_tool, list_collections], 
                 system_prompt = config.SYSTEM_MESSAGE):
        self.llm = llm
        self.tools = tools
        self.system_prompt = system_prompt

        self.collections = collections
        self.agent = create_react_agent(
            model=self.llm,
            tools=self.tools,
            prompt=self.system_prompt
        )

        

    def run(self, prompt: str):
        output = self.agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        return output['messages'][-1].content
    
    def qa_agent(self, query: str, collection_name: str):
        qa_agent = rag_tool(query=query, collection_name=collection_name)
        result = qa_agent.invoke({"query": query,
                                  "system_prompt": self.system_prompt})
        
        
        print(result)
        return result['result']
        
    def debug(self, prompt: str) -> None:
        print("SYSTEM MESSAGE: ",self.system_prompt)
        
        for step in self.agent.stream(
            {"messages": [{"role": "user", "content": prompt}]},
            stream_mode="values",
        ):
            step["messages"][-1].pretty_print()

# agent = Agent()

# question = "Cho toi tat cac thong tin 5 video youtube trong tai lieu"
# response = agent.qa_agent(question, collection_name="9e37d83d-470f-49db-a2be-3e4de650a391")
# print("Response:", response)













